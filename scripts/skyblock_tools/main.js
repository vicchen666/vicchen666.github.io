let mouseX, mouseY;

{
    $(function() {
        $(document).mousemove(function(event) {
            mouseX = event.pageX;
            mouseY = event.pageY;
        });
    });
    $("#button-toggle-sidebar").on("click", () => {
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
    });
    $("#button-skyblock-tools-main").on("click", () => {
        $("#main-container").children().addClass("invisible");
        $("#home").removeClass("invisible");
    });
    $("#button-skyblock-tools-fossil-finder").on("click", () => {
        $("#main-container").children().addClass("invisible");
        $("#fossil-finder").removeClass("invisible");
    });
}