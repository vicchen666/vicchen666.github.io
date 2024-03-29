{
    let select_slot;
    let fossil_count = null;

    function fossil_finder() {
        $("#main-container").children().addClass("invisible");
        $("#fossil-finder").removeClass("invisible");
    }
    function fossil_finder_reset() {
        $("#fossil-finder-excavator .invslot-item").css("background-image", "url('images/inventory slots/brown_stained_glass_pane.png')").empty();
        $("#fossil-finder-selection").addClass("invisible")
        $("#fossil-finder-progress").val("")
        fossil_count = null;
        fossil_finder_next_place(0);
    }
    function fossil_finder_progress_oninput(element) {
        let progress = $(element).val()
        console.log(progress)
        if (progress === "") {
            fossil_count = null;
            fossil_finder_next_place(0);
        } else if (progress > 0 && progress < 100) {
            let slot_item, fossil = 0;
            for (let y=0; y<6; y++) {
                for (let x=0; x<9; x++) {
                    slot_item = $("#fossil-finder-excavator > .ui-row:eq(" + y + ") > .invslot:eq(" + x + ") > .invslot-item").css("background-image").split("/").pop().replace(/\"|\)/g, "");
                    if (slot_item === "white_stained_glass_pane.png") {
                        fossil++;
                    }
                }
            }
                fossil_count = Math.round(fossil / progress * 100);
                fossil_finder_next_place(0);
         }
    }
    function transform_pattern(pattern, transformation) {
        let height = pattern.length;
        let width = pattern[0].length;
        let pattern_copy = [...pattern];
        if (transformation === 0) { // clockwise
            pattern = Array.from({length: width}, () => Array(height).fill(0));
            for (let j=0; j<height; j++) {
                for (let k=0; k<width; k++) {
                    pattern[k][height - 1 - j] = pattern_copy[j][k];
                }
            }
        } else if (transformation === 1) { // h-clip
            pattern = Array.from({length: height}, () => Array(width).fill(0));
            for (let j=0; j<height; j++) {
                for (let k=0; k<width; k++) {
                    pattern[j][width - 1 - k] = pattern_copy[j][k];
                }
            }
        } else if (transformation === 2) { // v-flip
            pattern = Array.from({length: height}, () => Array(width).fill(0));
            for (let j=0; j<height; j++) {
                for (let k=0; k<width; k++) {
                    pattern[height - 1 - j][k] = pattern_copy[j][k];
                }
            }
        } else if (transformation === 3) { // transpose
            pattern = Array.from({length: width}, () => Array(height).fill(0));
            for (let j=0; j<height; j++) {
                for (let k=0; k<width; k++) {
                    pattern[k][j] = pattern_copy[j][k];
                }
            }
        }
        return pattern;
    }
    function fossil_finder_next_place(mode, reveal=false) {
        $("#fossil-finder-excavator > .ui-row > .invslot > .invslot-item").filter(function () {
            return $(this).css("background-image").indexOf("lime_stained_glass_pane.png") !== -1;
        }).css("background-image", "url('images/inventory slots/brown_stained_glass_pane.png')").empty();
        let fossil_excavator = Array.from({length: 6}, () => Array(9).fill(0));
        let fossil_patterns = [[[0,1,0,0,0,0], // claw fossil
                                [1,1,1,1,0,0],
                                [0,1,1,0,1,0],
                                [0,1,0,1,0,1],
                                [0,0,1,0,1,0]],
                               [[0,0,0,0,1], // tusk fossil
                                [0,1,0,0,1],
                                [1,0,0,0,1],
                                [0,1,0,1,0],
                                [0,0,1,0,0]],
                               [[0,0,1,1,0,0], // ugly fossil
                                [0,1,1,1,1,0],
                                [1,1,1,1,1,1],
                                [0,1,1,1,1,0]],
                               [[1,1,1,1,1], // helix
                                [1,0,0,0,1],
                                [1,0,1,0,1],
                                [1,0,1,1,1]],
                               [[0,0,0,1,0,0,0], // webbed fossil
                                [1,0,0,1,0,0,1],
                                [0,1,0,1,0,1,0],
                                [0,0,1,1,1,0,0]],
                               [[1,0,1,0,1], // footprint fossil
                                [1,0,1,0,1],
                                [0,1,1,1,0],
                                [0,1,1,1,0],
                                [0,0,1,0,0]],
                               [[0,0,0,0,0,0,1,1], // clubbed fossil
                                [0,1,0,0,0,0,1,1],
                                [1,0,0,0,0,1,0,0],
                                [0,1,1,1,1,0,0,0]],
                               [[0,0,1,1,0,0], // spine fossil
                                [0,1,1,1,1,0],
                                [1,1,1,1,1,1]]];
        let fossil_variant = [[-1,1,2,3], [-1,0,0,3], [-1,0,0,0], [-1,0,2,3], [-1,0,0,0], [-1,0,0,0], [-1,1,2,1], [-1,0,0,0]]; // 0: clockwise 1: h-flip 2: v-flip 3: transpose
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
        if (fossil_count !== null) {
            fossil_variant = [13, 8, 16, 14, 10, 13, 11, 12].map((v,i) => v === fossil_count ? fossil_variant[i] : null).filter(v => v !== null);
            fossil_patterns = [13, 8, 16, 14, 10, 13, 11, 12].map((v,i) => v === fossil_count ? fossil_patterns[i] : null).filter(v => v !== null);
        }
        for (let i=0;i<fossil_patterns.length;i++) {
            let fossil_pattern = fossil_patterns[i]
            for (let transformation=0; transformation<4; transformation++) {
                fossil_pattern = transform_pattern(fossil_pattern, fossil_variant[i][transformation]);
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
        }
        if (mode === 0) {
            $("#fossil-finder > section > div:eq(2) > div").html("Possible Fossils: " + fossil);
            $("#fossil-finder-reveal").remove();
            if (fossil !== 0) {
                for (let i of fossil_slots) {
                    fossil_excavator[i[0]][i[1]] = -1;
                }
                let next_helpful_slot, next_slot = [0, 0], max_helpful_value, max_value = -1;
                for (let i=0; i<fossil_excavator.length; i++) {
                    for (let j=0; j<fossil_excavator[i].length; j++) {
                        if (fossil_excavator[i][j] > max_value) {
                            max_helpful_value = max_value;
                            next_helpful_slot = [...next_slot];
                            max_value = fossil_excavator[i][j];
                            next_slot = [i, j];
                        }
                    }
                }
                if (max_value / fossil === 1 && max_helpful_value > 0) {
                    max_value = max_helpful_value;
                    next_slot = [...next_helpful_slot]
                }
                if (reveal) {
                    if (max_value) {
                        $("#fossil-finder-excavator > .ui-row:eq(" + next_slot[0] + ") > .invslot:eq(" + next_slot[1] + ") > .invslot-item").css("background-image", "url('images/inventory slots/white_stained_glass_pane.png')");
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
        fossil_finder_next_place(0);
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
            $("#fossil-finder-progress").val("");
            fossil_finder_next_place(0);
        }
        $("#fossil-finder-selection").addClass("invisible");
    });
}