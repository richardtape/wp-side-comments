jQuery(document).ready(function($) {

	// Initialize ourselves
	var SideComments = require( 'side-comments' );

	// We get this data from PHP
	var postComments = commentsData.comments;
	var userData = commentsData.user;

	var nonce = commentsData.nonce;
	var postID = commentsData.postID;
	var ajaxURL = commentsData.ajaxURL;
	var containerSelector = commentsData.containerSelector;

	// Format our data as side-comments.js requires
	currentUser = {
		
		id: userData.id,
		avatarUrl: userData.avatar,
		name: userData.name

	};

	var formattedCommentData = [];
	var key;

	for( key in postComments ){

		if( arrayHasOwnIndex( postComments, key ) ){
			
			var additionalObject = {
				'sectionId': key,
				'comments': postComments[key]
			};

			formattedCommentData.push( additionalObject );

		}

	}

	// Then, create a new SideComments instance, passing in the wrapper element and the optional the current user and any existing comments.
	sideComments = new SideComments( containerSelector, currentUser, formattedCommentData );

	// http://stackoverflow.com/questions/9329446/how-to-do-for-each-over-an-array-in-javascript
	function arrayHasOwnIndex(array, prop) {
		return array.hasOwnProperty(prop) && /^0$|^[1-9]\d*$/.test(prop) && prop <= 4294967294; // 2^32 - 2
	}

	var newCommentID;
	
	//look for comment hash tag
	var commentHashTag = location.hash.match(/^#comment-([0-9]+).*$/);
	
	//if there is a comment hash tag match
	if ( commentHashTag != null ) {
		//get the ID from match index
		var previousCommentID = commentHashTag[1];
		
		//get previous comment by ID
		var previousComment = $('.commentable-section[data-section-id="' + previousCommentID + '"]' );
		
		
		$('html, body').animate({
		    scrollTop: (previousComment.offset().top - 100)
		},500);
		
		//if previous comment exists
		if (previousComment.length) {
			//open the comment
			$('a.marker', previousComment).trigger('click');
		}
	}

	// We need to listen for the post and delete events and post an AJAX response back to PHP
	sideComments.on( 'commentPosted', function( comment ){
		
		$.ajax( {
			url: ajaxURL,
			dataType: 'json',
			type: 'POST',
			data: {
				action: 'add_side_comment',
				nonce: nonce,
				postID: postID,
				sectionID: comment.sectionId,
				comment: comment.comment,
				authorName: comment.authorName,
				authorId: comment.authorId
			},
			success: function( response ){
				//get current .comments-wrapper by data-id
				var currentComment = $('.commentable-section[data-section-id="' + comment.sectionId + '"] .comments-wrapper' ),
				//get the .comment-box inside the current wrapper
				commentBox = $('.comment-box', currentComment),
				//get the error div if it exists
				errorDiv = $('.error-message', currentComment);
				
				if ( response.type == 'error' ) {
					//add an error class to the current comment wrapper
					currentComment.addClass('error');
					
					//if the error div doesn't exist, create it
					if ( !errorDiv.length ) {
						//and add the error message
						commentBox.after('<div class="error-message">' + response.message + '</div>');
						
						//set errorDiv to the newly created element
						errorDiv = $('.error-message', currentComment);
					} else{
						//otherwise set the error message
						errorDiv.text(response.message);
					}
					
					//if login is required and the login button doesn't exist
					if ( response.loginURL != undefined && !$('.login-button', currentComment).length ) {
						//add comment ID to redirect URL
						var redirectURL = response.loginURL + "%23comment-" + comment.sectionId;
						
						//create the login button
						errorDiv.after('<div class="login-button"><a href="' + redirectURL + '">Login</a></div>');
						
						//set loginButton to newly created element
						var loginButton = $('.login-button', currentComment);
					}
					
				} else if( response.type == 'success' ){
					//remove erorr class, add sucess class
					currentComment.removeClass('error').addClass('success');
					
					//remove error message on success
					errorDiv.remove();
					
					//if comment needs approval
					if ( !response.commentApproval ) {
						//remove everything except moderation message
						$('.comment-form', currentComment).html('<div class="error-message">' + response.message + '</div>');
					} else{
						//otherwise if comment doesn't need approval
						
						//add comment to steam
						comment.id = response.newCommentID;
						newCommentID = response.newCommentID;
	
						// We'll need this if we want to delete the comment.
						var newComment = sideComments.insertComment( comment );
					}
					

				} else{

					console.log( 'success, response.type not equal to success' );
					console.log( response );

				}

			}
		} );

	});

	// Listen to "commentDeleted" and send a request to your backend to delete the comment.
	// More about this event in the "docs" section.
	sideComments.on( 'commentDeleted', function( comment ){
	

		$.ajax( {
			url: ajaxURL,
			dataType: 'json',
			type: 'POST',
			data: {
				action: 'delete_side_comment',
				nonce: nonce,
				postID: postID,
				commentID: comment.id
			},
			success: function( response ){
				
				if( response.type == 'success' ){

					comment.sectionId = comment.sectionId;

					// OK, we can remove it from the stream
					sideComments.removeComment( comment.sectionId, newCommentID );

				}else{

					console.log( 'success, response.type not equal to success' );
					console.log( response );

				}

			},
			error: function( jqXHR, textStatus, errorThrown ){
				console.log( 'in error' );
				console.log( jqXHR );
				console.log( textStatus );
				console.log( errorThrown );
			}
		} );

		// $.ajax({
		// 	url: '/comments/' + commentId,
		// 	type: 'DELETE',
		// 	success: function( success ) {
		// 		// Do something.
		// 	}
		// });

	});

});