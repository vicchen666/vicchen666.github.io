window.onload = function() {
    let fossil = $("#fossil-finder section")
    let chest = fossil.children(".ui-chest")
    chest.append('<div class="ui-header">Fossil Excavator</div>')
    for (i=0; i<6; i++) {
        chest.append('<div class="ui-row"></div>')
    }
    for (i=0; i<9; i++) {
        chest.children(".ui-row").append('<div class="invslot"><div class="invslot-item" style="background-image: url(\'images/inventory slots/brown_stained_glass_pane.png\'); cursor: pointer;"></div></div>')
    }
    fossil.append('<div class="ui ui-chest invisible" style="position: absolute;"></div>')
    chest = fossil.children(".ui-chest:nth-child(2)")
    chest.append('<div class="ui-row"></div>')
    for (i=0; i<3; i++) {
        chest.children(".ui-row").append('<div class="invslot"><div class="invslot-item" style="background-image: url(\'images/inventory slots/brown_stained_glass_pane.png\'); cursor: pointer;"></div></div>')
    }
    fossil.append('<div style="float: right; margin-right:10px;">Possible Fossils: 0</div>')
    fossil.append('<div style="display: flex; align-items: center;"><div style="margin: 10px;">Mode: </div><button id="mode">Find Next Place</button></div>')
}
$("#fossil-finder section .ui-chest:first-child").on("click", ".invslot", function() {
    $("#fossil-finder section .ui-chest:nth-child(2)").removeClass("invisible").css({
        "top": mouseY - 110 + "px",
        "left": mouseX + 10 + "px"
    });
    let select_list = ["blank.png", "white_stained_glass_pane.png", "brown_stained_glass_pane.png", "barrier.png"];
    let slot_item = 
    $(this).children().css('background-image').split('/').pop().replace(/\"|\)/g, '')
    select_list = select_list.filter(function(item) {
        return item !== slot_item;
    });
    for (i=0; i<3; i++) {
        $("#fossil-finder .ui-chest:nth-child(2) .invslot:nth-child(" + (i + 1) + ") .invslot-item").css("background-image", "url(\'images/inventory slots/" + select_list[i] + "\')")
    }
});
$("#fossil-finder section .ui-chest:nth-child(2)").on("click", ".invslot", () => {

});

function fossil_finder() {
    $("#main-container").children().addClass("invisible")
    $("#fossil-finder").removeClass("invisible")
}


function fossil_finder_next_place() {

}