<?php
get_header();

// Verificação de segurança se o nonce foi postado e se é correto
if (isset($_POST['file_nonce'])) {
    if (wp_verify_nonce($_POST['file_nonce'], 'pdf-upload') && isset($_FILES['pdf_contribution'])) {

        $pdf_contribution_list = get_post_meta(get_the_ID(), 'pdf_contribution_list', true);

        $upload_dir = wp_upload_dir();
        $file_name = md5($_FILES['pdf_contribution']['name'] . $_FILES['pdf_contribution']['size']) . '.pdf';

        if (!file_exists($upload_dir['path'] . '/' . $file_name)) {
            move_uploaded_file($_FILES['pdf_contribution']['tmp_name'], $upload_dir['path'] . '/' . $file_name);

            $current_user = wp_get_current_user();
            $pdf_contribution_list[] = array('author' => $current_user->display_name,
                'pdf_url' => $upload_dir['url'] . '/' . $file_name,
                'email' => $current_user->user_email);

            update_post_meta(get_the_ID(), 'pdf_contribution_list', $pdf_contribution_list);
        }
    }
}
?>
    <div class="container">
        <div class="row">
            <div class="col-xs-12">
                <?php get_template_part("menu", "horizontal"); ?>
            </div>
        </div>
        <?php
        // Start the Loop.
        while (have_posts()) :
            the_post();
            // Include the page content template.
            include plugin_dir_path(__FILE__) . 'content-texto-em-debate-template.php';
        endwhile;
        ?>
    </div>
<?php
get_footer();
