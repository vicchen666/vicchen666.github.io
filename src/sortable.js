import $ from "jquery";

const sortable_instances = new WeakMap();

export default function sortable(list, enable = true, { drag_start, drag_over, drag_end } = {}) {
    if (enable) {
        if (sortable_instances.has(list)) return;

        const items = $(list).children().toArray();
        const item_listeners = new Map();

        items.forEach(item => {
            const on_mouse_down = (e) => {
                e.preventDefault();
                start_drag(e, item, list, { drag_start, drag_over, drag_end });
            };

            item.classList.add("sortable-item");
            item.addEventListener("mousedown", on_mouse_down);

            item_listeners.set(item, { on_mouse_down });
        });

        list.classList.add("sortable-container");
        sortable_instances.set(list, { items, item_listeners });
    } else {
        const instance = sortable_instances.get(list);
        if (!instance) return;

        list.classList.remove("sortable-container");

        for (const [item, listeners] of instance.item_listeners) {
            item.classList.remove("sortable-item", "sortable-dragging");
            item.removeEventListener("mousedown", listeners.on_mouse_down);
        }

        sortable_instances.delete(list);
    }
}

function start_drag(e, item, list, { drag_start, drag_over, drag_end }) {
    const rect = item.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const ghost = $(item).clone();
    ghost.css({
        position: "fixed",
        "z-index": "1000",
        opacity: "0.5",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        left: `${e.clientX - offsetX}px`,
        top: `${e.clientY - offsetY}px`
    }).removeClass("sortable-item").addClass("sortable-ghost");
    $(list).prepend(ghost);

    item.classList.add("sortable-dragging");
    

    if (typeof drag_start === "function") drag_start(e, ghost);

    const on_mouse_move = (moveEvent) => {
        ghost.css({
            left: `${moveEvent.clientX - offsetX}px`,
            top: `${moveEvent.clientY - offsetY}px`
        });

        ghost.css("pointer-events", "none");
        const pointed_element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        ghost.css("pointer-events", "auto");
        const swap_item = pointed_element?.closest(".sortable-item");

        if (
            swap_item &&
            swap_item !== item &&
            swap_item.parentElement === list
        ) {
            list.insertBefore(
                item,
                swap_item === item.nextSibling ? swap_item.nextSibling : swap_item
            );
            if (typeof drag_over === "function") drag_over(moveEvent, ghost);
        }
    };

    const on_mouse_up = (upEvent) => {
        document.removeEventListener("mousemove", on_mouse_move);
        document.removeEventListener("mouseup", on_mouse_up);

        ghost.remove();
        item.classList.remove("sortable-dragging");

        if (typeof drag_end === "function") drag_end(upEvent, ghost);
    };

    document.addEventListener("mousemove", on_mouse_move);
    document.addEventListener("mouseup", on_mouse_up);
}