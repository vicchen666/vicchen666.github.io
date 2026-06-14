{
    $("#button-projects").on("click", () => {
        $("#home").addClass("invisible");
        $("#projects").removeClass("invisible");
    });

    $("#button-about").on("click", () => {
        $("#home").addClass("invisible");
        $("#about").removeClass("invisible");
    });

    $(".back-to-home").on("click", () => {
        $("#projects").addClass("invisible");
        $("#about").addClass("invisible");
        $("#home").removeClass("invisible");
    });
}