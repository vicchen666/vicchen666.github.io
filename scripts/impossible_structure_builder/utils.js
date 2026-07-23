import $ from "jquery";
import * as v from "vectors";
import sortable from "sortable";

export function select_tool(c, tool) {
    c.tool_status.tool = tool;
    c.can_move_canvas = false;
    c.default_cursor = "default";
    c.preview_elements.beams.forEach(beam => beam.destroy());
    c.preview_elements = { vertices: [], beams: [], axes: [] };
    if (c.vertices.has(c.selected_elements.hovered)) {
        c.vertices.get(c.selected_elements.hovered).show = true;
    } else if (c.beams.has(c.selected_elements.hovered)) {
        c.beams.get(c.selected_elements.hovered).show = true;
        c.beams.get(c.selected_elements.hovered).assign_vertices();
    }
    c.selected_elements.selected.forEach(id => {
        if (c.vertices.has(id)) {
            c.vertices.get(id).show = true;
        } else if (c.beams.has(id)) {
            c.beams.get(id).show = true;
            c.beams.get(id).assign_vertices();
        }
    });
    c.selected_elements = { selected: [], hovered: -1 };
    $(".tool-submenu").addClass("invisible");
    toggle_element_settings(c, false);
    sortable($("#element-list")[0], false);

    const buttons = $(".element-list-item > button");
    buttons.addClass("default-cursor");

    switch (c.tool_status.tool) {
        case "move":
            c.can_move_canvas = true;
            c.default_cursor = "move";
            buttons.removeClass("default-cursor");
            sortable($("#element-list")[0], true, { drag_start: element_list_drag_start, drag_over: element_list_drag_over(c) });
            break;
        case "select":
            c.tool_status.status = "select_element";
            buttons.removeClass("default-cursor");
            break;
        case "add-vertex-click":
            c.tool_status.status = "add_vertex";
            break;
        case "extend-beam-vertex":
        case "extend-beam-length":
        case "connect-vertices":
        case "connect-vertex-along-axes":
        case "connect-vertex-beam":
        case "delete-vertex":
        case "dissolve-vertex":
            c.tool_status.status = "select_vertex";
            break;
        case "add-vertex-beam":
        case "add-beam-intersection":
        case "delete-beam":
            c.tool_status.status = "select_beam";
            break;
    }
    c.render_frame();
}

export function element_list_drag_start(e, li) {
    li.css("opacity", "1");
    $(".tool-submenu").addClass("invisible");
}

export function element_list_drag_over(c, e) {
    return e => {
        c.update_element_order(true);
        c.render_frame();
    };
}

export function reload_element_settings(c, id) {
    let element, type;
    if (c.vertices.has(id)) {
        element = c.vertices.get(id);
        type = "vertex";
    } else if (c.beams.has(id)) {
        element = c.beams.get(id);
        type = "beam";
    }
    const settings = $("#element-settings");
    settings.text("");
    settings.append($("<header>").data("id", id).attr("id", "element-settings-title").text(type.slice(0, 1).toUpperCase() + type.slice(1) + " Parameters"));
    const settings_grid = $("<section>").attr("id", "element-settings-grid").appendTo(settings);
    settings_grid.append($("<div>").text("Name"));
    settings_grid.append($("<input>").attr("type", "text").data("setting", "name").val(element.name));

    if (type === "vertex") {
        settings_grid.append($("<div>").text("X"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.position[0]));
        settings_grid.append($("<div>").text("Y"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.position[1]));
        settings_grid.append($("<div>").text("Axis 1 Positive"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.beams.get("1")?.name ?? "None"));
        settings_grid.append($("<div>").text("Axis 2 Positive"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.beams.get("2")?.name ?? "None"));
        settings_grid.append($("<div>").text("Axis 3 Positive"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.beams.get("3")?.name ?? "None"));
        settings_grid.append($("<div>").text("Axis 1 Negative"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.beams.get("-1")?.name ?? "None"));
        settings_grid.append($("<div>").text("Axis 2 Negative"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.beams.get("-2")?.name ?? "None"));
        settings_grid.append($("<div>").text("Axis 3 Negative"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.beams.get("-3")?.name ?? "None"));
    } else if (type === "beam") {
        settings_grid.append($("<div>").text("Start Vertex"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.vertices[0].name));
        settings_grid.append($("<div>").text("End Vertex"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.vertices[1].name));
        settings_grid.append($("<div>").text("Axis"));
        settings_grid.append($("<input>").attr("readonly", true).val(element.direction));
    }

    settings.append($("<section>").css("display", "flex")
    .append($("<button>").attr({"id": "element-center", "class": "text-button", "title": "Center the element"}).text("Center"))
    .append($("<button>").attr({"id": "element-delete", "class": "text-button", "title": "Delete the element"}).text("Delete")));

    toggle_element_settings(c, true);
}

export function toggle_element_settings(c, show) {
    if (show) {
        $("#element-settings").removeClass("invisible");
    } else {
        $("#element-settings").addClass("invisible");
    }
    c.set_canvas(true);
}

export function center_element(c, id) {
    if (c.vertices.has(id)) {
        const element = c.vertices.get(id);
        c.origin = [element.position[0] - c.canvas.width / (2 * c.size), element.position[1] + c.canvas.height / (2 * c.size)];
    } else if (c.beams.has(id)) {
        const element = c.beams.get(id);
        const midpoint = v.scale(v.add(element.vertices[0].position, element.vertices[1].position), 0.5);
        c.origin = [midpoint[0] - c.canvas.width / (2 * c.size), midpoint[1] + c.canvas.height / (2 * c.size)];
    }
    c.set_canvas();
}

export function delete_element(c, id) {
    if (c.vertices.has(id)) {
        c.vertices.get(id).beams.forEach(beam => {
            c.remove_element(c.beams.get(beam.id));
        });
        c.remove_element(c.vertices.get(id));
    } else if (c.beams.has(id)) {
        c.remove_element(c.beams.get(id));
    }

    c.selected_elements.selected = [];
    toggle_element_settings(c, false);
    c.render_frame();
}

export function normalize_hex_color(value) {
    const hex = String(value).replace("#", "").toLowerCase();
    if (hex.length === 3) {
        return hex.split("").map(char => char + char).join("");
    }
    return hex.slice(0, 6);
}

export function build_style_with_alpha(color, alpha) {
    const normalized_color = normalize_hex_color(color);
    const clamped_alpha = Math.max(0, Math.min(1, +alpha));
    const alpha_hex = Math.round(clamped_alpha * 255).toString(16).padStart(2, "0");
    return `#${normalized_color}${alpha_hex}`;
}

export function parse_style_with_alpha(style) {
    const hex = String(style || "").replace("#", "").toLowerCase();
    if (hex.length === 8) {
        return {
            color: `#${hex.slice(0, 6)}`,
            alpha: parseInt(hex.slice(6), 16) / 255,
        };
    }
    return {
        color: `#${normalize_hex_color(hex)}`,
        alpha: 1,
    };
}
