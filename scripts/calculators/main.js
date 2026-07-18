import $ from "jquery";

$("#button-hide-sidebar").on("click", () => {
    $("#main-sidebar").addClass("invisible");
    $("#button-show-sidebar").removeClass("invisible");
});
$("#button-show-sidebar").on("click", () => {
    $("#main-sidebar").removeClass("invisible");
    $("#button-show-sidebar").addClass("invisible");
});

$("#button-calculators-main").on("click", () => {
    $("#main-container").children().addClass("invisible");
    $("#main").removeClass("invisible"); 
});
$("#button-calculators-loot-luck").on("click", () => {
    $("#main-container").children().addClass("invisible");
    $("#loot-luck").removeClass("invisible"); 
});
