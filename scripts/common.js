let mouseX, mouseY;

{
    $(function() {
        $(document).mousemove(function(event) {
            mouseX = event.pageX;
            mouseY = event.pageY;
        });
    });
    $("#main-sidebar").on("click", "svg:eq(0)", () => {
        if ($("#main-sidebar > div").hasClass("invisible")) {
            $("#main-sidebar > div").removeClass("invisible");
            $("#main-sidebar > div > svg:eq(1)").removeClass("invisible");
            $("#main-sidebar").css("background-color", "#f1f1f166");
            $("#main-container").css("margin-left", "180px");
        } else {
            $("#main-sidebar > div").addClass("invisible");
            $("#main-sidebar > div > svg:eq(1)").addClass("invisible");
            $("#main-sidebar").css("background-color", "#00000000");
            $("#main-container").css("margin-left", "0");
        }
    });
    $("#main-sidebar").on("click", "svg:eq(1)", () => {
        $("#main-container").children().addClass("invisible");
        $("#home").removeClass("invisible");
    });

}