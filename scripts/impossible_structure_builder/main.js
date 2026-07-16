{
    // window.addEventListener("beforeunload", e => {
    //     e.preventDefault();
    //     e.returnValue = "";
    //     return "";
    // });

    document.addEventListener("DOMContentLoaded", () => {
    });

    $("#toolbar").on("click", ".tool-button", function() {
        $(this).addClass("selected");
        $(this).parent().siblings().find(".tool-button").removeClass("selected");
        $(this).siblings(".tool-submenu").addClass("invisible");
        c.tool_status.tool = $(this).data("tool");
        select_tool();
    });

    $("#toolbar").on("mouseenter", ".tool-button", function() {
        $(this).parent().siblings().find(".tool-submenu").addClass("invisible");
        $(this).parent().find(".tool-submenu").removeClass("invisible");
    });

    $("#toolbar").on("click", ".tool-submenu-button", function() {
        $(this).parent().addClass("invisible");
        const tool_button = $(this).parent().siblings(".tool-button");
        tool_button.addClass("selected");
        tool_button.parent().siblings().find(".tool-button").removeClass("selected");
        tool_button.data("tool", $(this).data("tool"));
        tool_button.children(".tool-icon").attr("src", $(this).children(".tool-icon").attr("src"));
        c.tool_status.tool = $(this).data("tool");
        select_tool();
    });

    function select_tool() {
        c.can_move_canvas = false;
        c.default_cursor = "default";
        c.preview_elements.beams.forEach(beam => beam.destroy());
        c.preview_elements = { vertices: [], beams: [], axes: [] };
        if (c.selected_elements.hovered in c.vertices) {
            c.vertices[c.selected_elements.hovered].show = true;
        } else if (c.selected_elements.hovered in c.beams) {
            c.beams[c.selected_elements.hovered].show = true;
            c.beams[c.selected_elements.hovered].assign_vertices();
        }
        c.selected_elements.selected.forEach(id => {
            if (id in c.vertices) {
                c.vertices[id].show = true;
            } else if (id in c.beams) {
                c.beams[id].show = true;
                c.beams[id].assign_vertices();
            }
        });
        c.selected_elements = { selected: [], hovered: -1 };
        switch (c.tool_status.tool) {
            case "move":
                c.can_move_canvas = true;
                c.default_cursor = "move";
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
            case "beam-intersection":
            case "delete-beam":
                c.tool_status.status = "select_beam";
                break;
        }
        c.render_frame();
    }

    $("#general-settings-icon").on("click", function() {
        $("#general-settings").toggleClass("invisible");
    });

    function normalize_hex_color(value) {
        const hex = String(value).replace("#", "").toLowerCase();
        if (hex.length === 3) {
            return hex.split("").map(char => char + char).join("");
        }
        return hex.slice(0, 6);
    }

    function build_style_with_alpha(color, alpha) {
        const normalized_color = normalize_hex_color(color);
        const clamped_alpha = Math.max(0, Math.min(1, +alpha));
        const alpha_hex = Math.round(clamped_alpha * 255).toString(16).padStart(2, "0");
        return `#${normalized_color}${alpha_hex}`;
    }

    function parse_style_with_alpha(style) {
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

    $(".general-settings-section-grid > input").on("change", function() {
        if ($(this).parent().data("setting_type") === "rendering_styles") {
            switch ($(this).data("setting")) {
                case "background_color":
                    canvas.style.backgroundColor = $(this).val();
                    break;
                case "vertex_fill_color_1":
                    c.settings.vertex_fill_styles[0] = $(this).val();
                    break;
                case "vertex_fill_color_2":
                    c.settings.vertex_fill_styles[1] = $(this).val();
                    break;
                case "vertex_fill_color_3":
                    c.settings.vertex_fill_styles[2] = $(this).val();
                    break;
                case "beam_fill_color_1":
                    c.settings.beam_fill_styles[0] = $(this).val();
                    break;
                case "beam_fill_color_2":
                    c.settings.beam_fill_styles[1] = $(this).val();
                    break;
                case "beam_fill_color_3":
                    c.settings.beam_fill_styles[2] = $(this).val();
                    break;
                case "hover_color": {
                    c.settings.hovered_style = build_style_with_alpha($(this).val(), parse_style_with_alpha(c.settings.hovered_style).alpha);
                    break;
                }
                case "hover_alpha": {
                    if ($(this).val() < 0) {
                        $(this).val(0);
                    } else if ($(this).val() > 1) {
                        $(this).val(1);
                    }
                    c.settings.hovered_style = build_style_with_alpha(parse_style_with_alpha(c.settings.hovered_style).color, $(this).val());
                    break;
                }
                case "select_color":
                    c.settings.selected_style = build_style_with_alpha($(this).val(), parse_style_with_alpha(c.settings.selected_style).alpha);
                    break;
                case "select_alpha":
                    if ($(this).val() < 0) {
                        $(this).val(0);
                    } else if ($(this).val() > 1) {
                        $(this).val(1);
                    }
                    c.settings.selected_style = build_style_with_alpha(parse_style_with_alpha(c.settings.selected_style).color, $(this).val());
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
            c.sync_settings();
            c.render_frame();
        }
    });

    $("#element-list").on("click", "> div > button", function() {
        if (c.tool_status.tool === "select") {
            c.selected_elements.selected.push(String($(this).data("id")));
            c.selected_elements.hovered = -1;
            c.render_frame();

        }
    }).on("mouseenter", "> div > button", function() {
        if (c.selected_elements.selected.includes(String($(this).data("id")))) return;
        c.selected_elements.hovered = String($(this).data("id"));
        c.render_frame();
    }).on("mouseleave", "> div > button", function() {
        if (c.selected_elements.selected.includes(String($(this).data("id")))) return;
        c.selected_elements.hovered = -1;
        c.render_frame();
    });
}