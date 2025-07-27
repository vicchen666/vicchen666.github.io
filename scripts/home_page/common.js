{
    $("#button-projects").on("click", () => {
        $("#home").addClass("invisible");
        $("#projects").removeClass("invisible");
    });

    $("#button-about").on("click", () => {
        $("#home").addClass("invisible");
        $("#about").removeClass("invisible");
    });

    $("#button-github").on("click", () => {
        window.open("https://github.com/vicchen666/vicchen666.github.io");
    });

    $(".back_to_home").on("click", () => {
        $("#projects").addClass("invisible");
        $("#about").addClass("invisible");
        $("#home").removeClass("invisible");
    });

    $("#button-projects-skyblock-tools").on("click", () => {
        window.location.href = "https://vicchen666.github.io/skyblock_tools.html";
    });
}