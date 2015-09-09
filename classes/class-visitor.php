<?php

/**
 * Classes criadas com base no plugin Comment Popularity
 * @link https://github.com/humanmade/comment-popularity/
 */

/**
 * Class WP_Side_Comments_Visitor
 */
abstract class WP_Side_Comments_Visitor
{
    const KEY_PREFIX = 'wp_side_comments';
    const KEY_VOTING_INTERVAL = 'wp_side_comments_voting_interval';
    const KEY_COOKIE_EXPIRY = 'wp_side_comments_cookie_expiry';
    const KEY_COOKIE_NAME = 'wp_side_comments_visitor';

    protected $visitorID;

    /**
     * Time needed between 2 votes by user on same comment.
     *
     * @var mixed|void
     */
    protected $interval;

    /**
     * Creates a new HMN_CP_Visitor object.
     */
    public function __construct($visitorID)
    {
        $this->visitorID = $visitorID;
        $this->interval = apply_filters(self::KEY_VOTING_INTERVAL, 15 * MINUTE_IN_SECONDS);
    }

    /**
     * @return mixed
     */
    abstract function logVote($commentID, $action);

    abstract function isVoteValid($commentID, $action = '');

    /**
     * @return string
     */
    public function getId()
    {
        return $this->visitorID;
    }

}

/**
 * Class WP_Side_Comments_Visitor_Guest
 */
class WP_Side_Comments_Visitor_Guest extends WP_Side_Comments_Visitor
{

    const KEY_GUESTS_LOGGED_VOTES = 'wp_side_comments_guests_logged_votes';
    const KEY_GUEST_LOGGED_VOTE = 'wp_side_comments_logged_guest_vote';

    /**
     * Stores the IP address.
     *
     * @var string
     */
    protected $cookie;

    protected $loggedVotes;

    /**
     * @param $visitorID
     */
    public function __construct($visitorID)
    {

        parent::__construct($visitorID);

        $this->setCookie();

        $this->retrieveLoggedVotes();
    }

    /**
     * Retrieves the logged votes from the DB option and returns those belonging to
     * the IP address in the cookie.
     *
     * @return mixed
     */
    protected function retrieveLoggedVotes()
    {

        if (is_multisite()) {
            $blogID = get_current_blog_id();
            $guestsLoggedVotes = get_blog_option($blogID, self::KEY_GUESTS_LOGGED_VOTES);
        } else {
            $guestsLoggedVotes = get_option(self::KEY_GUESTS_LOGGED_VOTES);
        }

        return $guestsLoggedVotes[$this->cookie];
    }

    /**
     *
     * @return mixed
     */
    public function getCookie()
    {
        return $this->cookie;
    }

    /**
     *
     */
    public function setCookie()
    {

        // Set a cookie with the visitor IP address that expires in a week.
        $expiry = apply_filters(self::KEY_COOKIE_EXPIRY, time() + (7 * DAY_IN_SECONDS));

        //Set a cookie now to see if they are supported by the browser.
        $secure = ('https' === parse_url(site_url(), PHP_URL_SCHEME) && 'https' === parse_url(home_url(), PHP_URL_SCHEME));

        setcookie(self::KEY_COOKIE_NAME, $this->visitorID, $expiry, COOKIEPATH, COOKIE_DOMAIN, $secure);
        if (SITECOOKIEPATH != COOKIEPATH) {
            setcookie(self::KEY_COOKIE_NAME, $this->visitorID, $expiry, SITECOOKIEPATH, COOKIE_DOMAIN, $secure);
        }

        // Make cookie available immediately by setting value manually.
        $_COOKIE[self::KEY_COOKIE_NAME] = $this->visitorID;

        $this->cookie = $_COOKIE[self::KEY_COOKIE_NAME];
    }

    /**
     * Save the user's vote to an option.
     *
     * @param $commentID
     * @param $action
     *
     * @return mixed
     */
    public function logVote($commentID, $action)
    {

        $loggedVotes = $this->retrieveLoggedVotes();

        $loggedVotes['comment_id_' . $commentID]['vote_time'] = current_time('timestamp');
        $loggedVotes['comment_id_' . $commentID]['last_action'] = $action;

        $this->saveLoggedVotes($loggedVotes);

        $loggedVotes = $this->retrieveLoggedVotes();

        $updated = $loggedVotes['comment_id_' . $commentID];

        /**
         * Fires once the user meta has been updated.
         *
         * @param int $visitor_id
         * @param int $commentID
         * @param array $updated
         */
        do_action(self::KEY_GUEST_LOGGED_VOTE, $this->visitorID, $commentID, $updated);

        return $updated;

    }

    /**
     * Save the votes for the current guest to the DB option.
     *
     * @param $votes
     */
    protected function saveLoggedVotes($votes)
    {

        $loggedVotes = array();

        if (is_multisite()) {
            $blogID = get_current_blog_id();
            $loggedVotes = get_blog_option($blogID, self::KEY_GUEST_LOGGED_VOTE);
            $loggedVotes[$this->visitorID] = $votes;
            update_blog_option($blogID, self::KEY_GUEST_LOGGED_VOTE, $loggedVotes);
        } else {
            $loggedVotes[$this->visitorID] = $votes;
            update_option(self::KEY_GUEST_LOGGED_VOTE, $loggedVotes);
        }
    }

    /**
     * Determine if the guest visitor can vote.
     *
     * @param        $commentID
     * @param string $action
     *
     * @return bool|WP_Error
     */
    public function isVoteValid($commentID, $action = '')
    {

        $guestVoteAllowed = false; //TODO: usar configuração do plugin para decidir se o voto anônimo deve ser permitido.

        if (!$guestVoteAllowed) {
            return new \WP_Error('not_allowed', 'Você precisa estar logado para executar essa ação.');
        }

        // @TODO: can we check cookies for a WP cookie matching current domain. If so, then ask user to log in.
        $loggedVotes = $this->retrieveLoggedVotes();

        // User has not yet voted on this comment
        if (empty($loggedVotes['comment_id_' . $commentID])) {
            return array();
        }

        // Is user trying to vote twice on same comment?
        $lastAction = $loggedVotes['comment_id_' . $commentID]['last_action'];

        if ($lastAction === $action) {
            return new \WP_Error('same_action', sprintf('Você não pode %s com este comentário de novo.', $action));
        }

        // Is user trying to vote too fast?
        $lastVoted = $loggedVotes['comment_id_' . $commentID]['vote_time'];

        $currentTime = current_time('timestamp');

        $elapsedTime = $currentTime - $lastVoted;

        if ($elapsedTime > $this->interval) {
            return true; // user can vote, has been over 15 minutes since last vote.
        } else {
            return new \WP_Error('voting_flood', 'Você não pode votar neste comentário novamente neste momento, aguarde ' . human_time_diff($lastVoted + $this->interval, $currentTime));
        }

    }

}

/**
 * Class WP_Side_Comments_Visitor_Member
 */
class WP_Side_Comments_Visitor_Member extends WP_Side_Comments_Visitor
{
    const KEY_COMMENTS_VOTED_ON = 'wp_side_comments_comments_voted_on';
    const KEY_UPDATE_COMMENTS_VOTED_ON = 'wp_side_comments_update_comments_voted_on_for_user';

    /**
     * @param $visitorID WP User ID.
     */
    public function __construct($visitorID)
    {

        parent::__construct($visitorID);
    }

    /**
     * Determine if the user can vote.
     *
     * @param        $commentID
     * @param string $action
     *
     * @return bool|WP_Error
     */
    public function isVoteValid($commentID, $action = '')
    {

        $comment = get_comment($commentID);

        if ($comment->user_id && ($this->visitorID === (int)$comment->user_id)) {
            return new \WP_Error('upvote_own_comment', sprintf('Você não pode %s o seu próprio comentário.', $action));
        }

        if (!is_user_logged_in()) {
            return new \WP_Error('not_logged_in', 'Você não está logado para votar nos comentários');
        }

        $loggedVotes = get_user_option(self::KEY_COMMENTS_VOTED_ON, $this->visitorID);

        // User has not yet voted on this comment
        if (empty($loggedVotes['comment_id_' . $commentID])) {
            return array();
        }

        // Is user trying to vote twice on same comment?
        $lastAction = $loggedVotes['comment_id_' . $commentID]['last_action'];

        if ($lastAction === $action) {
            return new \WP_Error('same_action', sprintf('Você não pode %s com este comentário de novo.', $action));
        }

        // Is user trying to vote too fast?
        $lastVoted = $loggedVotes['comment_id_' . $commentID]['vote_time'];

        $currentTime = current_time('timestamp');

        $elapsedTime = $currentTime - $lastVoted;

        if ($elapsedTime > $this->interval) {
            return true; // user can vote, has been over 15 minutes since last vote.
        } else {
            return new \WP_Error('voting_flood', 'Você não pode votar neste comentário novamente neste momento, aguarde ' . human_time_diff($lastVoted + $this->interval, $currentTime));
        }

    }

    /**
     * Save the user's vote to user meta.
     *
     * @param $commentID
     * @param $action
     *
     * @return mixed
     */
    public function logVote($commentID, $action)
    {

        $commentsVotedOn = get_user_option(self::KEY_COMMENTS_VOTED_ON, $this->visitorID);

        $commentsVotedOn['comment_id_' . $commentID]['vote_time'] = current_time('timestamp');
        $commentsVotedOn['comment_id_' . $commentID]['last_action'] = $action;

        update_user_option($this->visitorID, self::KEY_COMMENTS_VOTED_ON, $commentsVotedOn);

        $commentsVotedOn = get_user_option(self::KEY_COMMENTS_VOTED_ON, $this->visitorID);

        $updated = $commentsVotedOn['comment_id_' . $commentID];

        /**
         * Fires once the user meta has been updated.
         *
         * @param int $visitor_id
         * @param int $commentID
         * @param array $updated
         */
        do_action(self::KEY_UPDATE_COMMENTS_VOTED_ON, $this->visitorID, $commentID, $updated);

        return $updated;
    }

}
