import $ from "jquery";

export default function sortable(list, enable=true) {
    const items = $(list).children().toArray();
    if (enable) {
        list.classList.add("sortable-container");

        items.forEach(item => {
            item.draggable = true;
            item.classList.add("sortable-item");

            item.addEventListener("dragstart", handle_drag_start);
            item.addEventListener("dragend", handle_drag_end);
        });

        list.addEventListener("dragover", handle_drag_over);
    } else {
        if (!list.classList?.contains("sortable-container")) return;
        list.classList.remove("sortable-container");

        items.forEach(item => {
            item.draggable = false;
            item.classList.remove("sortable-item", "sortable-dragging");

            item.removeEventListener("dragstart", handle_drag_start);
            item.removeEventListener("dragend", handle_drag_end);
        });

        list.removeEventListener("dragover", handle_drag_over);
    }
}

function handle_drag_start(e) {
    e.currentTarget.classList.add("sortable-dragging");
}

function handle_drag_end(e) {
    e.currentTarget.classList.remove("sortable-dragging");
}

function handle_drag_over(e) {
    const list = e.currentTarget;
    const dragged_item = list.querySelector(".sortable-dragging");
    const pointed_element = document.elementFromPoint(e.clientX, e.clientY);
    const swap_item = pointed_element?.closest(".sortable-item");

    if (
        !dragged_item ||
        !swap_item ||
        swap_item === dragged_item ||
        swap_item.parentElement !== list
    ) return;

    const box = swap_item.getBoundingClientRect();
    const insert_after = e.clientY > box.top + box.height / 2;

    list.insertBefore(
        dragged_item,
        insert_after ? swap_item.nextElementSibling : swap_item
    );

    // list.insertBefore(
    //     dragged_item,
    //     swap_item === dragged_item.nextSibling ? swap_item.nextSibling : swap_item
    // );
}

// function sortable(list, enable=true) {
//     if (enable) {
//         $(list).addClass("sortable-container");
//         const items = $(list).children();
//         items.attr("draggable", true).addClass("sortable-item");
//         items[0].ondrag = handleDrag;
//         items[0].ondragend = handleDrop;
//     } else {
//         $(list).removeClass("sortable-container");
//         $(list).children().removeClass("sortable-item");
//         $(list).children().attr("draggable", false);
//     }
// }
// {
//     function handleDrag(e) {
//         const item = e.target;
//         const list = item.parentNode;
    
//         item.classList.add("sortable-dragging");
//         const swap_item = document.elementFromPoint(e.clientX, e.clientY).closest(".sortable-item");

//         if (swap_item === null || swap_item === item || swap_item.parentNode !== list) return;
    
//         list.insertBefore(item, swap_item === item.nextSibling ? swap_item.nextSibling : swap_item);
//     }

//     function handleDrop(e) {
//         e.target.classList.remove("sortable-dragging");
//     }
// }