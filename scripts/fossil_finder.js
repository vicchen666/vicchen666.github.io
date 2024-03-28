{
    let select_slot;

    function fossil_finder() {
        $("#main-container").children().addClass("invisible");
        $("#fossil-finder").removeClass("invisible");
        fossil_finder_next_place(0);
    }
    function fossil_finder_reset() {
        $("#fossil-finder-excavator .invslot-item").css("background-image", "url('images/inventory slots/brown_stained_glass_pane.png')").empty();
        fossil_finder_next_place(0);
    }
    function fossil_finder_next_place(mode, reveal=false) {
        $("#fossil-finder-excavator > .ui-row > .invslot > .invslot-item").filter(function () {
            return $(this).css("background-image").indexOf("lime_stained_glass_pane.png") !== -1;
        }).css("background-image", "url(\'images/inventory slots/brown_stained_glass_pane.png\')").empty();
        let fossil_excavator = Array.from({length: 6}, () => Array(9).fill(0));
        let fossil_patterns = [[[0,1,0,0,0,0], //claw fossil
                                [1,1,1,1,0,0],
                                [0,1,1,0,1,0],
                                [0,1,0,1,0,1],
                                [0,0,1,0,1,0]],
                                [[0,0,1,0,0], //tusk fossil
                                [0,1,0,1,0],
                                [1,0,0,0,1],
                                [1,0,0,1,0],
                                [1,0,0,0,0]],
                                [[0,0,1,1,0,0], //ugly fossil
                                [0,1,1,1,1,0],
                                [1,1,1,1,1,1],
                                [0,1,1,1,1,0]],
                                [[1,1,1,0,1], //helix
                                [1,0,1,0,1],
                                [1,0,0,0,1],
                                [1,1,1,1,1]],
                                [[0,0,0,1,0,0,0], //webbed fossil
                                [1,0,0,1,0,0,1],
                                [0,1,0,1,0,1,0],
                                [0,0,1,1,1,0,0]],
                                [[1,0,1,0,1], //footprint fossil
                                [1,0,1,0,1],
                                [0,1,1,1,0],
                                [0,1,1,1,0],
                                [0,0,1,0,0]],
                                [[0,0,0,0,0,0,1,1], //clubbed fossil
                                [0,1,0,0,0,0,1,1],
                                [1,0,0,0,0,1,0,0],
                                [0,1,1,1,1,0,0,0]],
                                [[0,0,1,1,0,0], //spine fossil
                                [0,1,1,1,1,0],
                                [1,1,1,1,1,1]]];
        let slot_item, fossil = 0, empty_slots = [], fossil_slots = [];
        for (let y=0; y<6; y++) {
            for (let x=0; x<9; x++) {
                slot_item = $("#fossil-finder-excavator > .ui-row:eq(" + y + ") > .invslot:eq(" + x + ") > .invslot-item").css("background-image").split("/").pop().replace(/\"|\)/g, "");
                if (slot_item === "white_stained_glass_pane.png") {
                    fossil_slots.push([y, x]);
                } else if (slot_item === "blank.png") {
                    empty_slots.push([y, x]);
                }
            }
        }
        for (let fossil_pattern of fossil_patterns) {
            for (let rotation=0; rotation<4; rotation++) {
                let height = fossil_pattern.length;
                let width = fossil_pattern[0].length;
                let fossil_pattern_copy = [...fossil_pattern];
                fossil_pattern = Array.from({length: width}, () => Array(height).fill(0));
                for (let j=0; j<height; j++) {
                    for (let k=0; k<width; k++) {
                        fossil_pattern[k][height - 1 - j] = fossil_pattern_copy[j][k];
                    }
                }
                for (let y=0; y<7-fossil_pattern.length; y++) {
                    for (let x=0; x<10-fossil_pattern[0].length; x++) {
                        let add_to_excavator = true;
                        for (let slot of empty_slots) {
                            if (slot[0] >= y && slot[0] < y + fossil_pattern.length && slot[1] >= x && slot[1] < x + fossil_pattern[0].length) {
                                if (fossil_pattern[slot[0] - y][slot[1] - x] === 1) {
                                    add_to_excavator = false;
                                    break;
                                }
                            }  
                        }
                        for (let slot of fossil_slots) {
                            if (slot[0] < y || slot[0] >= y + fossil_pattern.length || slot[1] < x || slot[1] >= x + fossil_pattern[0].length) {
                                add_to_excavator = false;
                                break;
                            } else if (fossil_pattern[slot[0] - y][slot[1] - x] === 0) {
                                add_to_excavator = false;
                                break;
                            }
                        }
                        if (add_to_excavator) {
                            fossil++;
                            for (let column=0; column<fossil_pattern.length; column++) {
                                for (let row=0; row<fossil_pattern[0].length; row++) {
                                    if (fossil_pattern[column][row]) {
                                        fossil_excavator[column + y][row + x]++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            console.log(fossil_excavator);
        }
        if (mode === 0) {
            $("#fossil-finder > section > div:eq(2) > div").html("Possible Fossils: " + fossil)
            $("#fossil-finder-reveal").remove();
            if (fossil !== 0) {
                for (let i of fossil_slots) {
                    fossil_excavator[i[0]][i[1]] = -1;
                }
                let next_slot, max_value = -1;
                for (let i=0; i<fossil_excavator.length; i++) {
                    for (let j=0; j<fossil_excavator[i].length; j++) {
                        if (fossil_excavator[i][j] > max_value) {
                            max_value = fossil_excavator[i][j];
                            next_slot = [i, j];
                        }
                    }
                }
                if (reveal) {
                    if (max_value) {
                        $("#fossil-finder-excavator > .ui-row:eq(" + next_slot[0] + ") > .invslot:eq(" + next_slot[1] + ") > .invslot-item").css("background-image", "url('images/inventory slots/white_stained_glass_pane.png')")
                        fossil_finder_next_place(0, true);
                    } else {
                        $("#fossil-finder-reveal").remove();
                    }
                } else {
                    if (max_value) {
                        $("#fossil-finder-excavator > .ui-row:eq(" + next_slot[0] + ") > .invslot:eq(" + next_slot[1] + ") > .invslot-item").css("background-image", "url('images/inventory slots/lime_stained_glass_pane.png')").append('<div style="display: grid; height: 48px;width: 48px;"><div style="font-size: 15px; justify-self: center;align-self: center;">' + Math.round(max_value / fossil * 100) + '%</div></div>');
                    }
                    if (fossil === 1 && max_value) {
                        $("#fossil-finder > section > div:eq(2)").prepend('<button id="fossil-finder-reveal" onclick="fossil_finder_next_place(0, true)">Reveal</button>');
                    }
                }
            }
        }
        
    }

    window.onload = function() {
        for (let i=0; i<6; i++) {
            $("#fossil-finder-excavator").append('<div class="ui-row"></div>');
        }
        for (let i=0; i<9; i++) {
            $("#fossil-finder-excavator > .ui-row").append('<div class="invslot"><div class="invslot-item" style="background-image: url(\'images/inventory slots/brown_stained_glass_pane.png\'); cursor: pointer;"></div></div>');
        }
        $("#fossil-finder-selection").append('<div class="ui-row"></div>');
        for (let i=0; i<3; i++) {
            $("#fossil-finder-selection > .ui-row").append('<div class="invslot"><div class="invslot-item" style="background-image: url(\'images/inventory slots/brown_stained_glass_pane.png\'); cursor: pointer;"></div></div>');
        }
    }
    $("#fossil-finder-excavator").on("click", ".invslot", function() {
        select_slot = $(this);
        $("#fossil-finder-selection").removeClass("invisible").css({
            "top": mouseY - 110 + "px",
            "left": mouseX + 10 + "px"
        });
        let select_list = ["blank.png", "white_stained_glass_pane.png", "brown_stained_glass_pane.png", "barrier.png"];
        let slot_item = 
        select_slot.children().css("background-image").split("/").pop().replace(/\"|\)/g, "");
        if (slot_item === "lime_stained_glass_pane.png") {
            slot_item = "brown_stained_glass_pane.png";
        }
        select_list = select_list.filter(function(item) {
            return item !== slot_item;
        });
        for (let i=0; i<3; i++) {
            $("#fossil-finder-selection > .ui-row > .invslot:eq(" + i + ") > .invslot-item").css("background-image", "url('images/inventory slots/" + select_list[i] + "')");
        }
    });
    $("#fossil-finder-selection").on("click", ".invslot", function() {
        if ($(this).children().css('background-image').split('/').pop().replace(/\"|\)/g, '') !== "barrier.png") {
            $("#fossil-finder-excavator > .ui-row > .invslot > .invslot-item").filter(function () {
                return $(this).css("background-image").indexOf("lime_stained_glass_pane.png") !== -1;
            }).css("background-image", "url('images/inventory slots/brown_stained_glass_pane.png')").empty();
            select_slot.children().css('background-image', $(this).children().css('background-image'));
            fossil_finder_next_place(0);
            
        }
        $("#fossil-finder-selection").addClass("invisible");
    });
}