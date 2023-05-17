let code = "";
let names = [], slots = [], items = [], amounts = [];

$("#Confirm").click(() => {
    code = $("#Code").val();
    if (code.includes("return")) {
        [names, slots, items, amounts] = parse(code);
        $("#Input").hide();
        $("#Search").show();
    }
});

$("#SearchInput").on("input", function () {
    let search =  $(this).val();
    $("#SearchResults li").remove();
    for (let i = 0; i < names.length; i++) {
        if (names[i].toLowerCase().search(search.toLowerCase()) !== -1) {
            $("#SearchResults p").before($("<li/>").append($("<a/>").attr("href", "https://hypixel-skyblock.fandom.com/wiki/" + names[i].replace(/\((.+\))|\\/,"")).attr("target", "_blank").html(names[i].replace("\\",""))).append(" (").append($("<a/>").addClass("editRecipe").html("edit")).append(" • ").append($("<span/>").addClass("previewRecipe").html("preview")).append(" • ").append($("<a/>").addClass("removeRecipe").html("remove")).append(")"));
        }
    }
    if ($("#SearchResults li").length > 1) {
        $("#SearchResults p").html("Total: " + $("#SearchResults li").length + " results.")
    } else if (($("#SearchResults li").length === 1)) {
        $("#SearchResults p").html("Total: 1 result.")
    } else {
        $("#SearchResults p").html("No recipe matched your search.")
    }
});
