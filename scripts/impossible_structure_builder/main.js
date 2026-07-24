import $ from "jquery";
import CanvasControl from "canvas_control";
import * as v from "vectors";
import * as utils from "utils";

// window.addEventListener("beforeunload", e => {
//     e.preventDefault();
//     e.returnValue = "";
//     return "";
// });
const TAU = Math.PI * 2;

$("#init-box")[0].showModal();
const init = {
    "init-vertex": new CanvasControl($("#init-box-axes-canvas-vertex")[0], { name: "init-vertex", moveable: false, animate: false }),
    "init-penrose": new CanvasControl($("#init-box-axes-canvas-penrose")[0], { name: "init-penrose", moveable: false, animate: false }),
    "axes": [],
    "status": ["valid"]
};
// init_canvas.forEach(canvas => {
//     canvas.set_axes([[Math.cos(TAU * 1/6), Math.sin(TAU * 1/6)], [-1, 0], [Math.cos(TAU * 5/6), Math.sin(TAU * 5/6)]]);
// });
const c = new CanvasControl($("#main-canvas > canvas")[0]);

document.addEventListener("keydown", e => {
    const active = document.activeElement;
    if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") {
        return;
    }
    const key = e.key.toLowerCase();

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
            $this.addClass("selected");
            $this.parent().siblings(".toolbar-item").find(".tool-button").removeClass("selected");
            utils.select_tool(c, $this.data("tool"));
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
    }
});

$("#init-box-axes-grid").on("input", "> input", function() {
    init.status = ["valid"];
    let axes_polar = [];
    $("#init-box-axes-grid > input").each(function() {
        const axis = +$(this).data("axis");
        const setting = $(this).data("setting");
        const value = +$(this).val();

        if (setting === "length" && value <= 0) {
            init.status = ["invalid", "Length must be greater than 0"];
            $("#init-box-confirm").css("color", "var(--error-color)");
            $("#init-box-axes-message").text(init.status[1]).removeClass("invisible");
            return;
        }

        if (!axes_polar[axis - 1]) axes_polar[axis - 1] = {};
        axes_polar[axis - 1][setting] = value;
    });

    axes_polar = axes_polar.map(axis => ({ length: axis.length, angle: axis.angle % 360 }));
    init.axes = axes_polar.map(axis => v.polar_to_cartesian(axis.length, axis.angle));
    let sum = 0;
    for (let i=0; i<3; i++) {
        const diff = (axes_polar[(i + 1) % 3].angle - axes_polar[i].angle + 720) % 360;
        sum += Math.min(diff, 360 - diff);
    }
    if (sum < 360) {
        init.status = ["invalid", "The axis directions must not all lie within the same semicircle."];
        $("#init-box-confirm").css("color", "var(--error-color)");
        $("#init-box-axes-message").text(init.status[1]).removeClass("invisible");
    }

    Object.values(init).forEach(canvas => {
        if (canvas instanceof CanvasControl) {
            canvas.set_axes(init.axes);
            canvas.activate();
        }
    });
    init["init-vertex"].selected_elements.selected = [$(this).data("axis")];
    init["init-vertex"].display_init_vertex();
    init["init-penrose"].display_init_penrose_triangle();

    if (init.status[0] === "valid") {
        $("#init-box-confirm").css("color", "var(--success-color)");
        $("#init-box-axes-message").addClass("invisible");
    }
});

$("#init-box-confirm").on("click", function() {
    if (init.status[0] === "invalid") return;
    const axes = init.axes;
    c.set_axes(axes);
    c.activate();
    $("#init-box")[0].close();
    utils.message("success", "Axes set successfully!");
});

$("#toolbar").on("click", ".tool-button", function() {
    $(this).addClass("selected");
    $(this).parent().siblings(".toolbar-item").find(".tool-button").removeClass("selected");
    utils.select_tool(c, $(this).data("tool"));
}).on("mouseenter", ".tool-button", function() {
    if ($(".sortable-ghost").length) return;

    $(this).parent().siblings().find(".tool-submenu").addClass("invisible");
    $(this).parent().find(".tool-submenu").removeClass("invisible");
}).on("click", ".tool-submenu-button", function() {
    $(this).parent().addClass("invisible");
    const tool_button = $(this).parent().siblings(".tool-button");
    tool_button.addClass("selected");
    tool_button.parent().siblings().find(".tool-button").removeClass("selected");
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
            case "hover_color": {
                c.settings.hovered_style = utils.build_style_with_alpha($(this).val(), utils.parse_style_with_alpha(c.settings.hovered_style).alpha);
                break;
            }
            case "hover_alpha": {
                if ($(this).val() < 0) {
                    $(this).val(0);
                } else if ($(this).val() > 1) {
                    $(this).val(1);
                }
                c.settings.hovered_style = utils.build_style_with_alpha(utils.parse_style_with_alpha(c.settings.hovered_style).color, $(this).val());
                break;
            }
            case "select_color":
                c.settings.selected_style = utils.build_style_with_alpha($(this).val(), utils.parse_style_with_alpha(c.settings.selected_style).alpha);
                break;
            case "select_alpha":
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

$("#init-box-axes-grid > input").eq(0).trigger("input");