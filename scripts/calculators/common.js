{
    $("#button-calculators-main").on("click", () => {
        $("#main-container").children().addClass("invisible");
        $("#main").removeClass("invisible"); 
    });

    $("#button-calculators-loot-luck").on("click", () => {
        $("#main-container").children().addClass("invisible");
        $("#loot-luck").removeClass("invisible"); 
    });
    

    $("#button-toggle-sidebar").on("click", () => {
       if ($("#main-sidebar").hasClass("invisible")) {
            $("#main-sidebar").removeClass("invisible");
            $("#main-sidebar > div").removeClass("invisible");
            $("#main-sidebar > div > a").removeClass("invisible");
            $("#main-sidebar").css("background-color", "#f1f1f166");
        } else {
            $("#main-sidebar").addClass("invisible");
            $("#main-sidebar > div").addClass("invisible");
            $("#main-sidebar > div > a").addClass("invisible");
            $("#main-sidebar").css("background-color", "#00000000");
        }
    });
}