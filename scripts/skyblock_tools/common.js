let mouseX, mouseY;

{
    $(function() {
        $(document).mousemove(function(event) {
            mouseX = event.pageX;
            mouseY = event.pageY;
        });
    });
    function hide_sidebar() {
        if ($("#main-sidebar > div").hasClass("invisible")) {
            $("#main-sidebar > div").removeClass("invisible");
            $("#main-sidebar > div > a").removeClass("invisible");
            $("#main-sidebar").css("background-color", "#f1f1f166");
            $("#main-container").css("margin-left", "180px");
        } else {
            $("#main-sidebar > div").addClass("invisible");
            $("#main-sidebar > div > a").addClass("invisible");
            $("#main-sidebar").css("background-color", "#00000000");
            $("#main-container").css("margin-left", "0");
        }
    }
    function skyblock_tools() {
        $("#main-container").children().addClass("invisible");
        $("#home").removeClass("invisible");
    }
}