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
            $("#SearchResults p").before($("<li/>").append($("<a/>").attr("href", "https://hypixel-skyblock.fandom.com/wiki/" + names[i].replace(/\((.+\))|\\/,"")).attr("title", names[i].replace("\\","")).attr("target", "_blank").html(names[i].replace("\\",""))).append(" (").append($("<a/>").addClass("editRecipe").html("edit")).append(" • ").append($("<span/>").addClass("previewRecipe").html("preview")).append(" • ").append($("<a/>").addClass("removeRecipe").html("remove")).append(")"));
        }
    }
    if ($("#SearchResults li").length > 1) {
        $("#SearchResults p").html("Total: " + $("#SearchResults li").length + " results.");
    } else if (($("#SearchResults li").length === 1)) {
        $("#SearchResults p").html("Total: 1 result.");
    } else {
        $("#SearchResults p").html("No recipe matched your search.");
    }
});

$("#SearchResults").on("click", ".editRecipe", function() {
    $("#Editor .page").remove();
    let page = "", editrecipe = names.indexOf($(this).parent().children("a:first").html().replace("'", "\\\\'"));
    for (let i = 0; i < slots[editrecipe].length; i++) {
        page = "<div class=\"page\"><div class=\"ui-Crafting_Table\"><div class=\"ui-input\"><div class=\"ui-row\"><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span></div><div class=\"ui-row\"><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span></div><div class=\"ui-row\"><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span></div></div><span class=\"ui-arrow\"></span><span class=\"ui-output\"><span class=\"invslot invslot-large\"><span class=\"invslot-item\"></span></span></span></div><table class=\"Attributes\"><tr><th></th><th>Slots</th><th>Items</th><th>Amounts</th><th><button class=\"addAttribute\">ADD</button></th></tr>";
        for (let j = 0; j < slots[editrecipe][i].length; j++) {
            page = page + "<tr><td>" + (j + 1) + ".</td><td><input value=\"" + slots[editrecipe][i][j] + "\"></td><td><input value=\"" + items[editrecipe][i][j].replace("\\", "") + "\"></td><td><input value=\"" + amounts[editrecipe][i][j] + "\"></td><td><button class=\"removeAttribute\">✖</button></td></tr>";
        }
        page = page + "<tr><td>" + (slots[editrecipe][i].length + 1) + ".</td><td><input value=\"0\"></td><td><input value=\"" + items[editrecipe][i][slots[editrecipe][i].length].replace("\\", "") + "\"></td><td><input value=\"" + amounts[editrecipe][i][slots[editrecipe][i].length] + "\"></td><td><button class=\"removeAttribute\">✖</button></td></tr>";
        page = page + "</table></div>"
        $("#Editor br:eq(1)").before(page);
    }
    $("#Search").hide();
    $("#Pages").html("1 / " + $("#Editor .page").length);
    $("#RecipeID").attr("value", names[editrecipe]);
    $("#Editor").show();
    for (let j = 0; j < $("#Editor .page").length; j++) {
        $("#Editor .page").hide();
        $("#Editor .page:eq(" + j + ")").show();
        update_crafting_table();
    }
    $("#Editor .page").hide();
    $("#Editor .page:first").show();
});
$("#Editor").on("input", "input:not([id])", () => {
    update_crafting_table();
});

$("#Editor").on("click", "#Cancel, #Save", () => {
    $("#Editor").hide();
    $("#Search").show();
});

$("#Editor").on("click", ".addAttribute", function() {  // add an attribute: slots, item, amount
    $(this).parents("tbody").children(":first").after("<tr><td>1.</td><td><input></td><td><input></td><td><input value=\"1\"></td><td><button class=\"removeAttribute\">✖</button></td></tr>");
    for (let i = 1; i < $(this).parents("tbody").children("tr").length; i++) {
        $(this).parents("tbody").children(":eq(" + i + ")").children(":first").html(i + ".");
    }
});

$("#Editor").on("click", ".removeAttribute", function() {  // remove an attribute: slots, item, amount
    if ($(this).parents("tbody").children("tr").length !== 2) {
        let tbody = $(this).parents("tbody");
        $(this).parents("tr").remove();
        for (let i = 1; i < tbody.children("tr").length; i++) {
            tbody.children(":eq(" + i + ")").children(":first").html(i + ".");
        }
        update_crafting_table();
    }
});

$("#Editor").on("click", "#AddPage", () => {
    $("#Editor .page:not(:hidden)").after("<div class=\"page\"><div class=\"ui-Crafting_Table\"><div class=\"ui-input\"><div class=\"ui-row\"><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span></div><div class=\"ui-row\"><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span></div><div class=\"ui-row\"><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span><span class=\"invslot\"><span class=\"invslot-item\"></span></span></div></div><span class=\"ui-arrow\"></span><span class=\"ui-output\"><span class=\"invslot invslot-large\"><span class=\"invslot-item\"></span></span></span></div><table class=\"Attributes\"><tr><th></th><th>Slots</th><th>Items</th><th>Amounts</th><th><button class=\"addAttribute\">ADD</button></th></tr><tr><td>1.</td><td><input></td><td><input></td><td><input value=\"1\"></td><td><button class=\"removeAttribute\">✖</button></td></tr></table></div>");
    $("#Editor .page:eq(" + ($("#Editor .page").index($(".page:not(:hidden)"))) + ")").hide();
    $("#Pages").html(($("#Editor .page").index($(".page:not(:hidden)")) + 1) + " / " + $("#Editor .page").length);
    update_crafting_table();
});

$("#Editor").on("click", "#RemovePage", () => {
    if ($("#Editor .page").length !== 1) {
        let page = $("#Editor .page").index($(".page:not(:hidden)"));
        if (page === 0) {
            $("#Editor .page:first").remove();
            $("#Editor .page:first").show();
            $("#Pages").html("1 / " + $("#Editor .page").length);
        } else {
            $("#Editor .page:eq(" + (page) + ")").remove();
            $("#Editor .page:eq(" + (page - 1) + ")").show();
            $("#Pages").html(($("#Editor .page").index($(".page:not(:hidden)")) + 1) + " / " + $("#Editor .page").length);
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
        $("#Editor .page:eq(" + (page) + ")").hide();
        $("#Editor .page:eq(" + (page - 1) + ")").show();
        $("#Pages").html(page + " / " + $("#Editor .page").length);
    }
    
});

$("#Editor").on("click", ".right-arrow", function() {
    let page = $("#Editor .page").index($(".page:not(:hidden)"));
    if ($("#Editor .page").length === page + 1) {
        $("#Editor .page:last").hide();
        $("#Editor .page:first").show();
        $("#Pages").html("1 / " + $("#Editor .page").length);
    } else {
        $("#Editor .page:eq(" + (page) + ")").hide();
        $("#Editor .page:eq(" + (page + 1) + ")").show();
        $("#Pages").html((page + 2) + " / " + $("#Editor .page").length);
    }
});

function update_crafting_table() {
    if([...new Set($("#Editor .page:not(:hidden) tr td:nth-child(2) input").map(function() {
        return $(this).val();
    }).get().join("").split(""))].join("") === $("#Editor .page:not(:hidden) tr td:nth-child(2) input").map(function() {
        return $(this).val();
    }).get().join("")) {
        for (let i = 0; i < 9; i++) {
            $("#Editor .page:not(:hidden) .ui-row:eq(" + ~~(i/3) +") .invslot:eq(" + (i % 3) + ") .invslot-item *").remove();
            $("#Editor .page:not(:hidden) .invslot-large .invslot-item *").remove();
            $("#Editor .page:not(:hidden) .ui-row:eq(" + ~~(i/3) +") .invslot:eq(" + (i % 3) + ") .invslot-item").append("<div style=\"font-size: 12px;\">" + (i + 1) + "</div>");
            $("#Editor .page:not(:hidden) .invslot-large .invslot-item").append("<div style=\"font-size: 12px;\">0</div>");
        }
        let invslot, item, amount
        for (i = 0; i < $("#Editor .page:not(:hidden) tr").length - 1; i++) {
            item = $("#Editor .page:not(:hidden) tr:eq(" + (i + 1) + ") td:eq(2) input").val().trim();
            amount = $("#Editor .page:not(:hidden) tr:eq(" + (i + 1) + ") td:eq(3) input").val().trim();
            $("#Editor .page:not(:hidden) tr:eq(" + (i + 1) + ") td:eq(1) input").val().split("").forEach(slot => {
                if (item !== "") {
                    if (slot === "0") {
                        invslot = $("#Editor .page:not(:hidden) .invslot-large .invslot-item")
                    } else {
                        invslot = $("#Editor .page:not(:hidden) .ui-row:eq(" + ~~((+slot - 1)/3) +") .invslot:eq(" + ((+slot - 1) % 3) + ") .invslot-item")
                    }
                    invslot.children("*").remove()
                    invslot.append("<a href=\"https://hypixel-skyblock.fandom.com/wiki/" + item + "\" target=\"_blank\"><div title=\"" + item + "\" style=\"font-size: 32px; text-align: center;\">" + item[0] + "</div></a>")
                    if (amount !== "1") {
                        invslot.append("<span class=\"invslot-stacksize\">" + amount + "</span>")
                    }
                }
            });
        }
    }
}
