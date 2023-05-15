// for module code

String.prototype.lastCharOf = function (regexp, fromIndex) {  // only for single char "1a2b3c".lastCharOf(/\d/, 4) = "2"
    for (let char = fromIndex - 1; char > -1; char--) {
        if (this.charAt(char).match(regexp) !== null) {
            return char;
        }
    }
    return -1;
}

function parse(code) {
    let names = [], slots = [], items = [], amounts = [];
    code = code.slice(code.indexOf("return") + 8, -2);  // use [''] = {'","""}, only
    code = code.split(/[,]?\t/);
    code = code.filter(recipe => recipe !== " ");
    code.forEach(recipe => {
        names.push(recipe.match(/(?<=\[').+(?='\])/)[0]);  // names = ["name1", "name2", "name3", ...]
        if (recipe.includes("//")) {
            slots.push([[]]);  // slots = [..., [[]]]
            items.push([[]]);  // items = [..., [[]]]
            Array.from(recipe.matchAll(/(?<=( |'))(\w|\*)+(?= ")/g)).forEach(slot_place => {
                if (recipe.charAt(slot_place.index - 2) === "/") {
                    slots[slots.length - 1].push([]);  // slots = [..., [..., []]]
                }
                let slot = placement_parse(recipe.slice(slot_place.index).match(/(\w|\*)+(?= ")/)[0]);
                slots[slots.length - 1][slots[slots.length - 1].length - 1].push(slot);  // slots = [..., [..., ["12", "56", "78"]]]
            });
        } else if (/(?<!Output = '.*);/.test(recipe)) {
            slots.push([[]]);  // slots = [..., [[]]]
            recipe.match(/(?<=( |'))(\w|\*)+(?= ")/g).forEach(slot => {  // for every item's slots
                slot = placement_parse(slot);  // example: A*B13C2 -> 123468
                slots[slots.length - 1][slots[slots.length - 1].length - 1].push(slot);  // slots = [..., [["12", "56", "78"]]]

            });
            for (let i = 0; i < recipe.match(/(?<!Output = '.*);/g).length; i++) {
                slots[slots.length - 1].push(slots[slots.length - 1][slots[slots.length - 1].length - 1]);  // slots = [..., [["12", "56", "78"], ["12", "56", "78"]]]
            }
        } else {
            slots.push([[]]);  // slots = [..., [[]]
            recipe.match(/(?<=( |'))(\w|\*)+(?= ")/g).forEach(slot => {  // for every item's slots
                slot = placement_parse(slot);
                slots[slots.length - 1][slots[slots.length - 1].length - 1].push(slot);  // slots = [..., [["12", "56", "78"]]]
            });
        }
    });
    return [names, slots, items, amounts];
}

function placement_parse(slot) {
    /*  
        A1 A2 A3      1 2 3
        B1 B2 B3  ->  4 5 6
        C1 C2 C3      7 8 9
    */
    if (slot === "**") {
        return "123456789";
    } else {
        let parsed_slot = "";
        Array.from(slot.matchAll(/\d|\*/g)).forEach(numbers_place => {  // example: slot = A*B13C2, numbers_place.index = 1, 3, 4, 6
            if (slot.charAt(numbers_place.index) !== "*" || numbers_place.index !== 0) {
                if (slot.charAt(numbers_place.index) === "*") {  // A*, B*, C*
                    let row = "ABC".indexOf(slot.charAt(slot.lastCharOf(/[A-C]/, numbers_place.index)));  // A*, B*, C* -> row = 0, 1, 2 
                    parsed_slot = parsed_slot + (row * 3 + 1) + (row * 3 + 2) + (row * 3 + 3) // row = 1 -> parsed_slot = parsed_slot + "456"
                } else {  // A1, A2, ..., C3, 1*, 2*, 3*
                    if (slot.charAt(slot.lastCharOf(/[A-C]|\*/, numbers_place.index)) === "*") {  // *1, *2, *3
                        let column = +slot.charAt(numbers_place.index);  // *1, *2, *3 -> column = 1, 2 ,3
                        parsed_slot = parsed_slot + column + (column + 3) + (column + 6)  // *2 -> parsed_slot = parsed_slot + "258"
                    } else {  // A1, A2, ..., C3
                        parsed_slot = parsed_slot + ("ABC".indexOf(slot.charAt(slot.lastCharOf(/[A-C]/, numbers_place.index))) * 3 + +slot.charAt(numbers_place.index));  // B3 -> parsed_slot = parsed_slot + "6" 
                    }
                }
            }
        });
        return [...new Set(parsed_slot.split(""))].sort().join("");
    }
}