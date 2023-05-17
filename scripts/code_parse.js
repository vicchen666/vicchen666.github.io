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
    code = code.slice(code.indexOf("return") + 8, -2);  // use ['.'] = {' . "., ."'}, only
    code = code.split(/[,]?\t/);
    code = code.filter(recipe => recipe !== " ");
    code.forEach(recipe => {
        names.push(recipe.match(/(?<=\[').+(?='\])/)[0]);  // names = ["name1", "name2", "name3", ...]
        if (recipe.includes("//")) {
            // slots
            slots.push([[]]);  // slots = [..., [[]]]          
            recipe.match(/((?<=( |'))(\w|\*)+(?= "))|\/\//g).forEach(slot => {  // match A1B3, *1A*, //, ...
                if (slot === "\/\/") {
                    slots[slots.length - 1].push([]);  // slots = [..., [..., []]]
                } else {
                    slots[slots.length - 1][slots[slots.length - 1].length - 1].push(placement_parse(slot));  // slots = [..., [..., ["12", "56", "78"]]]
                }
            });

            // items
            items.push([[]]);  // items = [..., [[]]]
            recipe.match(/((?<= ")[^ ][^",]*(?=("| |,)))|\/\//g).forEach(item => {  // match item1, item 2, //, ...
                if (item === "\/\/") {
                    items[items.length - 1].push([]);  // items = [..., [..., []]]
                } else {
                    items[items.length - 1][items[items.length - 1].length - 1].push(item);  // items = [..., [..., ["item1", "item2", "item3"]]]
                }
            });

            // amounts
            amounts.push([[]]);  // amounts = [..., [[]]]
            recipe.match(/((, \d*)?[^ ](?="))|\/\//g).forEach(amount => {  // match , 64, , 2, r, e, 4000, //
                if (amount === "\/\/") {
                    amounts[amounts.length - 1].push([]);  // amounts = [..., [..., []]]
                } else if (amount.includes(",")) {  // if amount > 1
                    amounts[amounts.length - 1][amounts[amounts.length - 1].length - 1].push(amount.slice(2));  // amounts = [..., [..., [..., "64"]]]
                } else {
                    amounts[amounts.length - 1][amounts[amounts.length - 1].length - 1].push("1");  // amounts = [..., [..., [..., "1"]]]
                }
            });
        } else if (/(?<! = '.*);/.test(recipe)) {
            // slots
            slots.push([[]]);  // slots = [..., [[]]]
            recipe.match(/(?<=( |'))(\w|\*)+(?= ")/g).forEach(slot => {  // for every item's slots
                slot = placement_parse(slot);  // example: A*B13C2 -> 123468
                slots[slots.length - 1][slots[slots.length - 1].length - 1].push(slot);  // slots = [..., [["12", "56", "78"]]]

            });
            for (let i = 0; i < recipe.match(/(?<! = '.*);/g).length; i++) {
                slots[slots.length - 1].push(Array.from(slots[slots.length - 1][slots[slots.length - 1].length - 1]));  // slots = [..., [["12", "56", "78"], ["12", "56", "78"]]]
            }

            // items
            items.push([]);  // items = [..., []]
            for (i = 0; i < slots[slots.length - 1].length; i++) {
                items[items.length - 1].push([]);  // items = [..., [..., []]]
                recipe.match(/(?<= ")[^ ][^",]*(?=("| |,))/g).forEach(item => {  // match item1, item 2, //, ...
                    if (item.includes(";")) {
                        items[items.length - 1][items[items.length - 1].length - 1].push(item.split("; ")[i]);  // items = [..., [..., [..., "item"]]]
                    } else {
                        items[items.length - 1][items[items.length - 1].length - 1].push(item);  // items = [..., [..., [..., "item"]]]
                    }
                });
            }

            // amounts
            amounts.push([[]]);  // amounts = [..., [[]]]
            recipe.match(/((, \d*)?[^ ](?="))/g).forEach(amount => {  // match , 64, , 2, r, e, 4000
                if (amount.includes(",")) {  // if amount > 1
                    amounts[amounts.length - 1][amounts[amounts.length - 1].length - 1].push(amount.slice(2));  // amounts = [..., [[..., "64"]]]
                } else {
                    amounts[amounts.length - 1][amounts[amounts.length - 1].length - 1].push("1");  // amounts = [..., [[..., "1"]]]
                }
            });
            for (let i = 0; i < slots[slots.length - 1].length - 1; i++) {
                amounts[amounts.length - 1].push(Array.from(amounts[amounts.length - 1][amounts[amounts.length - 1].length - 1]));  // amounts = [..., [[..., "64"], [..., "64"]]]
            }
        } else {
            // slots
            slots.push([[]]);  // slots = [..., [[]]
            recipe.match(/(?<=( |'))(\w|\*)+(?= ")/g).forEach(slot => {  // for every item's slots
                slot = placement_parse(slot);
                slots[slots.length - 1][slots[slots.length - 1].length - 1].push(slot);  // slots = [..., [["12", "56", "78"]]]
            });

            // items
            items.push([[]]);  // items = [..., [[]]]
            recipe.match(/(?<= ")[^ ][^",]*(?=("| |,))/g).forEach(item => {  // match item1, item 2, //, ...
                items[items.length - 1][items[items.length - 1].length - 1].push(item);  // items = [..., [[..., "item"]]]
            });

            // amounts
            amounts.push([[]]);  // amounts = [..., [[]]]
            recipe.match(/((, \d*)?[^ ](?="))/g).forEach(amount => {  // match , 64, , 2, r, e, 4000
                if (amount.includes(",")) {  // if amount > 1
                    amounts[amounts.length - 1][amounts[amounts.length - 1].length - 1].push(amount.slice(2));  // amounts = [..., [[..., "64"]]]
                } else {
                    amounts[amounts.length - 1][amounts[amounts.length - 1].length - 1].push("1");  // amounts = [..., [[..., "1"]]]
                }
            });
        }
        
        // recipe's output
        if (recipe.includes(" = '")) {  // including Output = 'output1'
            // items
            let output_items = recipe.match(/(?<= ').+(?=')/g)[0].replace(/, \d+/,"");  // match output1, 1; output2 and remove , 1
            if (output_items.includes(";")) {  // including multiple outputs
                output_items = output_items.split("; ");
                for (i = 0; i < slots[slots.length - 1].length; i++) {
                    items[items.length - 1][i].push(output_items[i]);
                }
            } else {
                for (i = 0; i < slots[slots.length - 1].length; i++) {
                    items[items.length - 1][i].push(output_items[0]);
                }
            }

            // amounts
            let output_amounts = recipe.match(/(?<= ').+(?=,)/g)[0].match(/((, \d*)?[^ ](?=(;|'\})))/g)  // match , 1, , 64, e, 0
            if (output_items.includes(";")) {
                for (i = 0; i < slots[slots.length - 1].length; i++) {
                    if (output_amounts[i].includes(",")) {
                        amounts[amounts.length - 1][i].push(output_amounts[i].slice(2));  // amounts = [..., [..., [..., "64"], ...]]
                    } else {
                        amounts[amounts.length - 1][i].push("1");  // amounts = [..., [..., [..., "1"], ...]]
                    }
                }
            } else {
                for (i = 0; i < slots[slots.length - 1].length; i++) {
                    if (output_amounts[0].includes(",")) {
                        amounts[amounts.length - 1][i].push(output_amounts[0].slice(2));  // amounts = [..., [..., [..., "64"], ...]]
                    } else {
                        amounts[amounts.length - 1][i].push("1");  // amounts = [..., [..., [..., "1"], ...]]
                    }
                }
            }
        } else {
            // items
            let output_items = recipe.match(/(?<=\[').+(?='\])/g)  // match ['...']
            for (i = 0; i < slots[slots.length - 1].length; i++) {
                items[items.length - 1][i].push(output_items[0]);
            }

            // amounts
            let output_amounts = recipe.match(/(?<=, ).+(?='\])/g)  // match [', ...']
            console.log(recipe);
            console.log(output_amounts);
            console.log(slots[slots.length - 1]);
            console.log(amounts[amounts.length - 1]);
            for (i = 0; i < slots[slots.length - 1].length; i++) {
                if (output_amounts !== null) {
                    amounts[amounts.length - 1][i].push(output_amounts[0]);  // amounts = [..., [..., [..., "64"], ...]]
                } else {
                    console.log(i);
                    amounts[amounts.length - 1][i].push("1");  // amounts = [..., [..., [..., "1"], ...]]
                }
            }
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