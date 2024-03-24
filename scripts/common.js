$("#main-sidebar").on("click", "svg", () => {
    if ($("#main-sidebar a").is(":visible")) {
        $("#main-sidebar a").hide()
        $("#main-sidebar").css("background-color", "#00000000")
        $("#main-container").css("margin-left", "0")
    } else {
        $("#main-sidebar a").show()
        $("#main-sidebar").css("background-color", "#f1f1f166")
        $("#main-container").css("margin-left", "180px")
    }
})
window.addEventListener("hashchange", function() {
    var newHash = window.location.hash;
    console.log("Hash changed to: " + newHash);
    if (newHash === "#fossil_finder") {
        $("#fossil-finder").show()
        fossil_finder()
        console.log("URL changed to #fossil_finder");
        // You can replace this console log with any action you want to perform
    }
});

function fossil_finder() {
    chest = $("#fossil-finder section .ui-chest")
    chest.append("<div class=\"ui-header\">Fossil Excavator</div>")
    for (i=0; i<6; i++) {
        chest.append("<div class=\"ui-row\"></div>")
    }
    for (i=0; i<9; i++) {
        chest.children(".ui-row").append("<div class=\"invslot\"><div class=\"invslot-item\"></div></div>")
    }
}
