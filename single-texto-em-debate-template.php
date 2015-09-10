<?php get_header(); ?>
    <div class="container">
        <?php
        // Start the Loop.
        while (have_posts()) :
            the_post();
            // Include the page content template.
            include plugin_dir_path(__FILE__) . 'content-menu-texto-template.php';
            include plugin_dir_path(__FILE__) . 'content-texto-em-debate-template.php';
        endwhile;
        ?>
        <div class="back-to-top">
            <a href="#" class="white"><i class="fa fa-level-up"></i> Voltar para o topo</a>
        </div>
    </div>
<?php get_footer(); ?>