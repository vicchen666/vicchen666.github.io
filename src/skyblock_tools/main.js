import $ from "jquery";

$("#button-hide-sidebar").on("click", () => {
    $("#main-sidebar").addClass("invisible");
    $("#button-show-sidebar").removeClass("invisible");
});
$("#button-show-sidebar").on("click", () => {
    $("#main-sidebar").removeClass("invisible");
    $("#button-show-sidebar").addClass("invisible");
});

$("#button-skyblock-tools-main").on("click", () => {
    $("#main-container").children().addClass("invisible");
    $("#home").removeClass("invisible");
});
$("#button-skyblock-tools-fossil-finder").on("click", () => {
    $("#main-container").children().addClass("invisible");
    $("#fossil-finder").removeClass("invisible");
});