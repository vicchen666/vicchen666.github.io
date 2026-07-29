import $ from "jquery";
import CanvasControl from "canvas_control";
import * as v from "vectors";
import * as utils from "utils";
import * as storage from "storage";

const TAU = Math.PI * 2;

window.addEventListener("beforeunload", e => {
    e.preventDefault();
    e.returnValue = "";
    return "";
});

document.addEventListener("mousedown", e => {
    if ($("dialog[open]").length) return;
    if ($(e.target).closest("#toolbar").length) return;

    $(".tool-submenu").addClass("invisible");
});

$("#init-box")[0].showModal();
const init = {
    "init-vertex": new CanvasControl($("#init-box-axes-canvas-vertex")[0], { name: "init_vertex", moveable: false, animate: false }),
    "init-penrose": new CanvasControl($("#init-box-axes-canvas-penrose")[0], { name: "init_penrose", moveable: false, animate: false }),
    "axes": [],
    "status": ["valid"]
};

let c = new CanvasControl($("#main-canvas > canvas")[0]);

document.addEventListener("keydown", e => {
    const active = document.activeElement;
    if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") {
        return;
    }
    const key = e.key.toLowerCase();

    if ($(".sortable-ghost").length) return;
    if ($("dialog[open]").length) {
        switch (key) {
            case "i":
                $("#info-box")[0].close();
                break;
        }
        return;
    };

    switch (key) {
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
            const $this = $(".toolbar-item").eq(+key - 1).find(".tool-button");
            $(".tool-button.selected").removeClass("selected");
            $this.addClass("selected");
            utils.select_tool(c, $this.data("tool"));
            break;
        case "escape":
            $(".tool-button.selected").first().trigger("click");
            break;
        case "i":
            $("#info-box")[0].showModal();
            break;
        case "delete":
        case "backspace":
        case "d":
            if (c.tool_status.tool !== "select") return;
            if (!c.selected_elements.selected.length) return;
            utils.delete_element(c, c.selected_elements.selected[c.selected_elements.selected.length - 1]);
            break;
        case "c":
            if (!c.selected_elements.selected.length) return;
            utils.center_element(c, c.selected_elements.selected[c.selected_elements.selected.length - 1]);
            break;
        case "s":
            storage.download_project(c);
            break;
        case "o":
            $("#button-open").click();
            break;
    }
});

$("#init-box-axes-grid").on("input", "> input", function() {
    init.status = ["valid"];
    let axes_polar = [];
    $("#init-box-axes-grid > input").each(function() {
        const axis = +$(this).data("axis");
        const setting = $(this).data("setting");
        const value = +$(this).val();

        if (!axes_polar[axis - 1]) axes_polar[axis - 1] = {};

        if (setting === "length" && value <= 0) {
            init.status = ["invalid", "Length must be greater than 0"];
            axes_polar[axis - 1][setting] = 1;
        } else {
            axes_polar[axis - 1][setting] = value;
        }
    });

    axes_polar = axes_polar.map(axis => ({ length: axis.length, angle: axis.angle % 360 }));
    init.axes = axes_polar.map(axis => v.polar_to_cartesian(axis.length, axis.angle));
    let sum = 0;
    let invalid = false;
    for (let i=0; i<3; i++) {
        const diff = (axes_polar[(i + 1) % 3].angle - axes_polar[i].angle + 720) % 360;
        if (diff === 180) {
            invalid = true;
            break;
        }

        sum += Math.min(diff, 360 - diff);
    }
    if (invalid || sum < 360) {
        init.status = ["invalid", "The axis directions must not all lie within the same semicircle."];
    }

    init["init-vertex"].selected_elements.selected = [$(this).data("axis")];
    init["init-vertex"].set_axes(init.axes);
    init["init-vertex"].render_frame();

    if (init.status[0] === "valid") {
        init["init-penrose"].set_axes(init.axes);
        init["init-penrose"].render_frame();
        $("#init-box-confirm").css("color", "var(--success-color)");
        $("#init-box-axes-message").addClass("invisible");
    } else {
        init["init-penrose"].clear();
        $("#init-box-confirm").css("color", "var(--error-color)");
        $("#init-box-axes-message").text(init.status[1]).removeClass("invisible");
    }
});

$("#init-box-confirm").on("click", function() {
    if (init.status[0] === "invalid") return;
    const axes = init.axes;
    c.set_axes(axes);
    c.activate();
    $("#init-box")[0].close();
    init["init-vertex"].destroy();
    init["init-penrose"].destroy();
    init["init-vertex"] = null;
    init["init-penrose"] = null;
    utils.message("success", "Axes set successfully!");
});

$("#init-box-open").on("click", function() {
    storage.open_project().then(new_c => {
        if (new_c !== null) {
            c.destroy();
            c = new_c;
            c.activate();
            $("#init-box")[0].close();
            init["init-vertex"].destroy();
            init["init-penrose"].destroy();
            init["init-vertex"] = null;
            init["init-penrose"] = null;

            $(".tool-button.selected").first().trigger("click");
        }
    });
});

$("#toolbar").on("click", ".tool-button", function() {
    $(".tool-button.selected").removeClass("selected");
    $(this).addClass("selected");
    utils.select_tool(c, $(this).data("tool"));
}).on("mouseenter", ".tool-button", function() {
    if ($(".sortable-ghost").length) return;

    $(".tool-submenu").addClass("invisible");
    $(this).parent().find(".tool-submenu").removeClass("invisible");
}).on("click", ".tool-submenu-button", function() {
    $(this).parent().addClass("invisible");
    const tool_button = $(this).parent().siblings(".tool-button");
    $(".tool-button.selected").removeClass("selected");
    tool_button.addClass("selected");

    tool_button.data("tool", $(this).data("tool"));
    tool_button.children(".tool-icon").attr("src", $(this).children(".tool-icon").attr("src"));
    utils.select_tool(c, $(this).data("tool"));
});

$("#element-list").on("click", "> .element-list-item > button", function() {
    if (c.tool_status.tool === "select") {
        if (c.selected_elements.selected.includes($(this).data("id"))) {
            c.selected_elements.selected = [];
            c.selected_elements.hovered = $(this).data("id");
            utils.toggle_element_settings(c, false);
        } else {
            c.selected_elements.selected = [$(this).data("id")];
            c.selected_elements.hovered = -1;
            utils.reload_element_settings(c, c.selected_elements.selected[0]);
        }
        c.render_frame();
    }
}).on("mouseenter", "> .element-list-item > button", function() {
    if ($(".sortable-ghost").length) return;
    if (c.selected_elements.selected.includes($(this).data("id"))) return;

    c.selected_elements.hovered = $(this).data("id");
    c.render_frame();
}).on("mouseleave", "> .element-list-item > button", function() {
    if ($(".sortable-ghost").length) return;
    if (c.selected_elements.selected.includes($(this).data("id"))) return;

    c.selected_elements.hovered = -1;
    c.render_frame();
});

$("#element-settings").on("input", "#element-settings-grid > input", function() {
    const id = $("#element-settings-title").data("id");
    let element, type;
    if (c.vertices.has(id)) {
        element = c.vertices.get(id);
        type = "vertex";
    } else if (c.beams.has(id)) {
        element = c.beams.get(id);
        type = "beam";
    }

    switch($(this).data("setting")) {
        case "name":
            if($(this).val()) {
                element.name = $(this).val();
                $(".element-list-item > button").filter(function() {return $(this).data("id") === element.id}).text($(this).val());
            }
            break;
    }

    c.render_frame();
}).on("click", "#element-center", function() {
    utils.center_element(c, $("#element-settings-title").data("id"));
}).on("click", "#element-delete", () => {
    utils.delete_element(c, $("#element-settings-title").data("id"));
});

$("#tool-box").on("input", "#tool-box-add-vertex-coordinates input", function() {
    const setting = $(this).data("setting");
    const inputs = $("#tool-box-add-vertex-coordinates input");
    switch(setting) {
        case "x":
        case "y": {
            const pos = [
                +inputs.filter("[data-setting='x']").val() ?? 0,
                +inputs.filter("[data-setting='y']").val() ?? 0
            ];

            // Maintain axis_3 coordinate while changing axis_1 and axis_2 to fit the new x and y coordinates
            const axes = c.axes;
            const axis_3 = inputs.filter("[data-setting='axis_3']").val() ?? 0;
            const new_pos = v.sub(pos, v.scale(axes[2], axis_3));
            const result = v.lineq2(axes[0], axes[1], new_pos);
            const axis_1 = result[0];
            const axis_2 = result[1];
            inputs.filter("[data-setting='axis_1']").val(axis_1);
            inputs.filter("[data-setting='axis_2']").val(axis_2);

            c.preview_elements.vertices = [];
            c.preview_elements.vertices.push(c.create_vertex(pos, { preview: true }));
            c.render_frame();
            break;
        }
        case "axis_1":
        case "axis_2":
        case "axis_3": {
            const axes = [
                +inputs.filter("[data-setting='axis_1']").val() ?? 0,
                +inputs.filter("[data-setting='axis_2']").val() ?? 0,
                +inputs.filter("[data-setting='axis_3']").val() ?? 0
            ];
            const pos = v.add(v.scale(c.axes[0], axes[0]), v.add(v.scale(c.axes[1], axes[1]), v.scale(c.axes[2], axes[2])));

            inputs.filter("[data-setting='x']").val(pos[0]);
            inputs.filter("[data-setting='y']").val(pos[1]);

            c.preview_elements.vertices = [];
            c.preview_elements.vertices.push(c.create_vertex(pos, { preview: true }));
            c.render_frame();
            break;    
        }

    }
}).on("input", "#tool-box-extrude-vertex-length input", function() {
    const setting = $(this).data("setting");
    const inputs = $("#tool-box-extrude-vertex-length input");
    const direction = c.preview_elements.axes[0].direction;
    const axis = c.generate_axis_map().get(direction);
    let length;
    switch(setting) {
        case "length": {
            length = +inputs.filter("[data-setting='length']").val() ?? 0;
            inputs.filter("[data-setting='axis']").val(length / v.len(axis));
            break;
        }
        case "axis": {
            length = +inputs.filter("[data-setting='axis']").val() ?? 0;
            length *= v.len(axis);
            inputs.filter("[data-setting='length']").val(length);
            break;
        }
    }

    c.preview_elements.axes[0].show = true;
    c.preview_elements.vertices = [];
    c.preview_elements.beams[c.preview_elements.beams.length - 1]?.destroy();
    c.preview_elements.beams = [];

    if (length <= 0) {
        c.render_frame();
        return;
    }

    const vertex1 = c.vertices.get(c.selected_elements.selected[c.selected_elements.selected.length - 1]);
    const vertex2 = c.create_vertex(v.add(vertex1.position, v.scale(v.unit(axis), length)), { preview: true });
    c.preview_elements.axes[0].show = false;
    c.preview_elements.vertices.push(vertex2);
    c.preview_elements.beams.push(c.create_beam([vertex1, vertex2], Math.abs(direction), { preview: true }));
    c.render_frame();
}).on("click", "#tool-box-confirm", function() {
    switch(c.tool_status.tool) {
        case "add-vertex-coordinates":
            if (c.preview_elements.vertices.length !== 1) return;

            c.register_element(c.preview_elements.vertices[0]);
            c.preview_elements.vertices = [];
            c.render_frame();
            break;
        case "extrude-vertex-length":
            if (c.preview_elements.beams.length !== 1) return;

            c.register_element(c.preview_elements.beams[0]);
            c.register_element(c.preview_elements.vertices[0]);
            c.preview_elements.beams = [];
            c.preview_elements.vertices = [];
            c.selected_elements.selected = [];
            c.tool_status.status = "select_vertex";
            c.render_frame();
            $("#tool-box").addClass("invisible");
            break;
    }
}).on("keydown", "input", function(e) {
    if (e.key === "Enter") {
        $("#tool-box-confirm").trigger("click");
    }
});

$("#general-settings-icon").on("click", function() {
    $("#general-settings").toggleClass("invisible");
});

$(".general-settings-section-grid > input").on("change", function() {
    if ($(this).parent().data("setting_type") === "rendering_styles") {
        switch ($(this).data("setting")) {
            case "background_color":
                c.canvas.style.backgroundColor = $(this).val();
                break;
            case "vertex_fill_color_1":
                c.settings.fill_styles.vertex[0] = $(this).val();
                break;
            case "vertex_fill_color_2":
                c.settings.fill_styles.vertex[1] = $(this).val();
                break;
            case "vertex_fill_color_3":
                c.settings.fill_styles.vertex[2] = $(this).val();
                break;
            case "beam_fill_color_1":
                c.settings.fill_styles.beam[0] = $(this).val();
                break;
            case "beam_fill_color_2":
                c.settings.fill_styles.beam[1] = $(this).val();
                break;
            case "beam_fill_color_3":
                c.settings.fill_styles.beam[2] = $(this).val();
                break;
            case "hovered_color": {
                c.settings.hovered_style = utils.build_style_with_alpha($(this).val(), utils.parse_style_with_alpha(c.settings.hovered_style).alpha);
                break;
            }
            case "hovered_alpha": {
                if ($(this).val() < 0) {
                    $(this).val(0);
                } else if ($(this).val() > 1) {
                    $(this).val(1);
                }
                c.settings.hovered_style = utils.build_style_with_alpha(utils.parse_style_with_alpha(c.settings.hovered_style).color, $(this).val());
                break;
            }
            case "selected_color":
                c.settings.selected_style = utils.build_style_with_alpha($(this).val(), utils.parse_style_with_alpha(c.settings.selected_style).alpha);
                break;
            case "selected_alpha":
                if ($(this).val() < 0) {
                    $(this).val(0);
                } else if ($(this).val() > 1) {
                    $(this).val(1);
                }
                c.settings.selected_style = utils.build_style_with_alpha(utils.parse_style_with_alpha(c.settings.selected_style).color, $(this).val());
                break;
            case "axis_arrow_color":
                c.settings.axis_style = $(this).val();
                break;
            case "preview_alpha":
                if ($(this).val() < 0) {
                    $(this).val(0);
                } else if ($(this).val() > 1) {
                    $(this).val(1);
                }
                c.settings.preview_alpha = +$(this).val();
                break;
        }
        c.render_frame();
    }
});

$("#button-info").on("click", function() {
    $("#info-box")[0].showModal();
});

$("#info-box-close").on("click", function() {
    $("#info-box")[0].close();
});

$("#button-download").on("click", () => {
    storage.download_project(c);
});

$("#button-open").on("click", () => {
    storage.open_project().then(new_c => {
        if (new_c !== null) {
            c.destroy();
            c = new_c;
            c.activate();
            $(".tool-button.selected").first().trigger("click");
        }
        c.render_frame();
    });
});

$("#init-box-axes-grid > input").eq(0).trigger("input");
init["init-vertex"].activate();
init["init-penrose"].activate();