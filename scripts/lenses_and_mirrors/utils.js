
import $ from "jquery";

export function reload_element_settings(c, type, index) {
    const optical_elements = ["Convex Lens", "Concave Lens", "Convex Mirror", "Concave Mirror", "Flat Mirror", "Barrier"];
    const light_sources = ["Point Source", "Parallel Source"];
    const settings = $("#element-settings");
    const element = c[type][index];
    settings.text("");
    const type_select = $("<select>").attr("id","element-settings-select-type");
    if (type === "optical_elements") {
        settings.append($("<header>").data({"type": type, "index": index}).attr("id", "element-settings-title").text("Optical Element"));
        optical_elements.forEach(e => {
            type_select.append($("<option>").attr("value", e.toLowerCase().replace(" ", "_")).text(e));
        });
    } else {
        settings.append($("<header>").data({"type": type, "index": index}).attr("id", "element-settings-title").text("Light Source"));
        light_sources.forEach(e => {
            type_select.append($("<option>").attr("value", e.toLowerCase().replace(" ", "_")).text(e));
        });
    }
    settings.append(type_select);
    switch (element.type) {
        case "lens":
            type_select.val(element.focal_length > 0 ? "convex_lens" : "concave_lens");
            break;
        case "mirror":
            type_select.val(element.focal_length > 0 ? "concave_mirror" : "convex_mirror");
            break;
        case "point":
        case "parallel":
            type_select.val(`${element.type}_source`);
            break;
        default:
            type_select.val(element.type);
    }

    const settings_grid = $("<section>").attr("id", "element-settings-grid").appendTo(settings);
    for (const [key, value] of Object.entries(element)) {
        if (c.elements_settings[element.type].includes(key)) {
            switch (key) {
                case "name":
                    settings_grid.append($("<div>").text("Name"));
                    settings_grid.append($("<input>").attr("type", "text").data("setting", "name").val(value));
                    break;
                case "position":
                    settings_grid.append($("<div>").text("X"));
                    settings_grid.append($("<input>").attr({"type": "number", "step": "any"}).data("setting", "x").val(value[0]));
                    settings_grid.append($("<div>").text("Y"));
                    settings_grid.append($("<input>").attr({"type": "number", "step": "any"}).data("setting", "y").val(value[1]));
                    break;
                case "rotation":
                    settings_grid.append($("<div>").text("Rotation (deg)"));
                    settings_grid.append($("<input>").attr({"type": "number", "step": "any"}).data("setting", "rotation").val(value));
                    break;
                case "focal_length":
                    settings_grid.append($("<div>").text("Focal Length"));
                    settings_grid.append($("<input>").attr({"type": "number", "step": "any", "min": 0}).data("setting", "focal_length").val(Math.abs(value)));
                    break;
                case "size":
                    settings_grid.append($("<div>").text("Size"));
                    settings_grid.append($("<input>").attr({"type": "number", "step": "any", "min": 0}).data("setting", "size").val(value));
                    break;
                case "density":
                    settings_grid.append($("<div>").text("Density"));
                    settings_grid.append($("<input>").attr({"type": "number", "step": "any", "min": 0}).data("setting", "density").val(value));
                    break;
                case "angle":
                    settings_grid.append($("<div>").text("Angle (deg)"));
                    settings_grid.append($("<input>").attr({"type": "number", "step": "any", "min": 0, "max": 360}).data("setting", "angle").val(value));
                    break;
            }
        }
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
    c.render_frame();
}

export function center_element(c, id) {
    let index = c.optical_elements.findIndex(e => e.id === id);
    let type;
    if (index === -1) {
        type = "light_sources";
        index = c.light_sources.findIndex(e => e.id === id);
    } else {
        type = "optical_elements";
        index = c.optical_elements.findIndex(e => e.id === id);
    }
    c.center_on(c[type][index].position);
    c.render_frame();
}

export function delete_element(c, id) {
    let index = c.optical_elements.findIndex(e => e.id === id);
    if (index !== -1) {
        $(".element-list-item > button").filter(function() { return $(this).data("id") === c.optical_elements[index].id }).parent().remove();
        c.remove_element("optical_elements", index);
    } else {
        index = c.light_sources.findIndex(e => e.id === id);
        if (index !== -1) {
            $(".element-list-item > button").filter(function() { return $(this).data("id") === c.light_sources[index].id }).parent().remove();
            c.remove_element("light_sources", index);
        }
    }

    c.selected_elements.selected = [];
    toggle_element_settings(c, false);
    c.update_light_path();
}

export function reload_general_settings(c) {
    $("#general-settings input").each(function() {
        $(this).val(c[$(this).data("setting")]);
    });
}

export function message(type, text) {
    switch (type) {
        case "success":
            $("#message-box").css("background-color", "var(--success-color)");
            break;
        case "fail":
            $("#message-box").css("background-color", "var(--error-color)");
            break;
    }
    $("#message-box").text(text).hide().fadeIn(500).delay(3000).fadeOut(1000);
}
