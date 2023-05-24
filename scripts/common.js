let code = "";
let names = [], slots = [], items = [], amounts = [];

$("#Input").on("click", "#CodeConfirm", () => {
    code = $("#CodeInput").val();
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

$("#SearchResults").on("click", ".editRecipe", () => {
    $("#Search").hide();
    $("#Pages").html("1 / " + $("#Editor .page").length);
    $("#Editor").show();
});

$("#Editor").on("click", "#Cancel, #Save", () => {
    $("#Editor").hide();
    $("#Search").show();
});

$(".attributes").on("click", ".addattribute", function() {  // add an attribute: slots, item, amount
    $(this).parents("tbody").children(":first").after("<tr><th>1.</th><th><input></th><th><input></th><th><input></th><td><button class=\"removeattribute\">✖</button></td></tr>");
    for (let i = 1; i < $(this).parents("tbody").children("tr").length; i++) {
        $(this).parents("tbody").children(":nth(" + i + ")").children(":first").html(i + ".");
    }
});

$(".attributes").on("click", ".removeattribute", function() {  // remove an attribute: slots, item, amount
    if ($(this).parents("tbody").children("tr").length !== 2) {
        let tbody = $(this).parents("tbody");
        $(this).parents("tr").remove();
        for (let i = 1; i < tbody.children("tr").length; i++) {
            tbody.children(":nth(" + i + ")").children(":first").html(i + ".");
        }
    }
});

$("#Editor").on("click", ".left-arrow", function() {
    let page = $("#Editor .page").index($(".page:not(:hidden)"));
    if (page === 0) {
        $("#Editor .page:first").hide();
        $("#Editor .page:last").show();
        $("#Pages").html($("#Editor .page").length + " / " + $("#Editor .page").length);
    } else {
        $("#Editor .page:nth(" + (page) + ")").hide();
        $("#Editor .page:nth(" + (page - 1) + ")").show();
        $("#Pages").html(page + " / " + $("#Editor .page").length);
    }
    
});

$("#Editor").on("click", ".right-arrow", function() {
    let page = $("#Editor .page").index($(".page:not(:hidden)"));
    console.log(page)
    if ($("#Editor .page").length === page + 1) {
        $("#Editor .page:last").hide();
        $("#Editor .page:first").show();
        $("#Pages").html("1 / " + $("#Editor .page").length);
    } else {
        $("#Editor .page:nth(" + (page) + ")").hide();
        $("#Editor .page:nth(" + (page + 1) + ")").show();
        $("#Pages").html((page + 2) + " / " + $("#Editor .page").length);
    }
    
});