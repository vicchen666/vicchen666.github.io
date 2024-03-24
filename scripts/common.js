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
    // Code to run when the hash part of the URL changes
    var newHash = window.location.hash;
    console.log("Hash changed to: " + newHash);
    
    // Check if the new hash is "#fossil_finder"
    if (newHash === "#fossil_finder") {
        // Perform your action here
        console.log("URL changed to #fossil_finder");
        // You can replace this console log with any action you want to perform
    }
});
