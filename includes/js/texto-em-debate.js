/**
 * Created by josafa on 08/09/15.
 */

jQuery("document").ready(function ($) {
    var menutop = $('.menu-topo-mc');
    var position = menutop.offset().top;
    $(window).scroll(function () {
        var fixing = ($(this).scrollTop() > position) ? true : false;
        menutop.toggleClass("fixed-top-mc", fixing);
    });

    $("select.form-control").change(function () {
        var value = this.value;
        $('body').animate({
            scrollTop: $("#" + value).offset().top
        }, 500);
    })
});