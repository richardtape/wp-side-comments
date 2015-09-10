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
        scrollTo($("#" + value));
    });

    $("#btn-search-texto-em-debate").click(function () {
        highlightText();
    });

    $("#prev-highlight").click(function () {
        prevHighlight()
    });

    $("#next-highlight").click(function () {
        nextHighlight()
    });

    $('#txt-texto-em-debate').keyup(function (e) {
        if (e.keyCode == 13) {
            highlightText();
        }
    });

    function highlightText() {
        var text = $("#txt-texto-em-debate").val();

        $(".commentable-container").removeHighlight();
        $(".total-highlight").html(0);
        $(".current-highlight").html(0);

        if (text.length > 0) {
            $(".commentable-container").highlight(text);

            var highlights = $(".commentable-container").find(".highlight");
            $(".total-highlight").html(highlights.length);
            $(".current-highlight").html(1);

            setCurrentHighlight(highlights.first());
        }
    }

    function prevHighlight() {
        var highlights = $(".commentable-container").find(".highlight");
        var currentHighlight = $(".commentable-container").find(".highlight.current");
        var currentIndex = highlights.index(currentHighlight);

        if (currentIndex <= 0) {
            setCurrentHighlight(highlights.last());
            $(".current-highlight").html(highlights.length);
        } else {
            setCurrentHighlight(highlights.get(--currentIndex));
            $(".current-highlight").html(currentIndex + 1);
        }
    }

    function nextHighlight() {
        var highlights = $(".commentable-container").find(".highlight");
        var currentHighlight = $(".commentable-container").find(".highlight.current");
        var currentIndex = highlights.index(currentHighlight);

        if (currentIndex >= highlights.length - 1) {
            setCurrentHighlight(highlights.first());
            $(".current-highlight").html(1);
        } else {
            setCurrentHighlight(highlights.get(++currentIndex));
            $(".current-highlight").html(currentIndex + 1);
        }
    }

    function setCurrentHighlight(element) {
        var currentHighlight = $(".commentable-container").find(".highlight.current");
        currentHighlight.removeClass("current");
        $(element).addClass("current");
        scrollTo(element);
    }

    function scrollTo(element) {
        $('body').animate({
            scrollTop: $(element).offset().top - $('.menu-topo-mc').outerHeight()
        }, 500);
    }
});