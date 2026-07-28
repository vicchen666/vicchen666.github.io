import $ from "jquery";
import CanvasControl from "canvas_control";
import * as v from "vectors";
import * as utils from "utils";
import * as storage from "storage";

const TAU = Math.PI * 2;
let c = new CanvasControl($("#main-canvas > canvas")[0]);
c.activate();

window.addEventListener("beforeunload", e => {
    e.preventDefault();
    e.returnValue = "";
    return "";
});

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
        case "i":
            $("#info-box")[0].showModal();
            break;
        case "delete":
        case "backspace":
        case "d":
            if (!c.selected_elements.selected.length) return;
            utils.delete_element(c, c.selected_elements.selected[c.selected_elements.selected.length - 1]);
            break;
        case "c":
            if (!c.selected_elements.selected.length) return;
            utils.center_element(c, c .selected_elements.selected[c.selected_elements.selected.length - 1]);
            break;
        case "s":
            storage.download_project(c);
            break;
        case "o":
            $("#input-open").click();
            break;
    }
});

$(".tab").on("click", function() {
    const index = $(this).index();
    $(this).css("border-width", "0"); 
    $(this).css("cursor", "default");
    $(this).removeClass("clickable");
    switch (index) {
        case 0:
            $(this).siblings().css({"border-width": "0 0 1px 1px", "cursor": "pointer"}).addClass("clickable");
            $("#element-add").removeClass("invisible");
            $("#element-list").addClass("invisible");
            break;
        case 1:
            $(this).siblings().css({"border-width": "0 1px 1px 0", "cursor": "pointer"}).addClass("clickable");
            $("#element-add").addClass("invisible");
            $("#element-list").removeClass("invisible");
            break;
    }
});

$(".element-add-item > button").on("click", function() {
    const position = v.round(c.get_canvas_center());
    const element = {id: c.next_id, name:`New ${$(this).text()}`, type: "lens", position: position, size: 400, rotation: -90, unit_vector: [0, -1], angle: 90, focal_length: 200, density: 100};
    switch($(this).parent().index()) {
        case 1:
            element.focal_length = -200;
            break;
        case 2:
            element.type = "mirror";
            element.focal_length = -200;
            break;
        case 3:
            element.type = "mirror";
            break;
        case 4:
            element.type = "flat_mirror";
            break;
        case 5:
            element.type = "barrier";
            break;
        case 6:
            element.type = "point";
            element.rotation = 0;
            element.unit_vector = [1, 0];
            break;
        case 7:
            element.type = "parallel";
            element.rotation = 0;
            element.unit_vector = [1, 0];
            break;
    }

    $("#element-list").append($("<li>").addClass("element-list-item").append($("<button>").data("id", c.next_id++).text(`New ${$(this).text()}`)));
    c.add_element($(this).data("type"), element);
    c.update_light_path();
});

$("#element-list").on("click", "> .element-list-item > button", function() {
    const element_id = +$(this).data("id");
    const selected_id = c.selected_elements.selected[0];
    if (element_id === selected_id) {
        c.selected_elements.selected = [];
        $(this).removeClass("selected");
        utils.toggle_element_settings(c, false);
    } else {
        c.selected_elements.selected = [element_id];
        $(".element-list-item > button").removeClass("selected");
        $(this).addClass("selected");
        const index = c.optical_elements.findIndex(e => e.id === element_id);
        if (index !== -1) {
            utils.reload_element_settings(c, "optical_elements", index);
        } else {
            utils.reload_element_settings(c, "light_sources", c.light_sources.findIndex(e => e.id === element_id));
        }
    }
}).on("mouseenter", "> .element-list-item > button", function () {
    c.selected_elements.hovered = +$(this).data("id");
}).on("mouseleave", "> .element-list-item > button", function() {
    c.selected_elements.hovered = -1;
});

$("#element-settings").on("change", "> #element-settings-select-type", function() {
    const type = $("#element-settings-title").data("type");
    const index = $("#element-settings-title").data("index");
    switch($(this).val()) {
        case "concave_lens":
            c[type][index].focal_length = -Math.abs(c[type][index].focal_length);
            c[type][index].type = "lens";
            break;
        case "convex_lens":
            c[type][index].focal_length = Math.abs(c[type][index].focal_length);
            c[type][index].type = "lens";
            break;
        case "concave_mirror":
            c[type][index].focal_length = Math.abs(c[type][index].focal_length);
            c[type][index].type = "mirror";
            break;
        case "convex_mirror":
            c[type][index].focal_length = -Math.abs(c[type][index].focal_length);
            c[type][index].type = "mirror";
            break;
        case "flat_mirror":
            c[type][index].type = "flat_mirror";
            break;
        case "barrier":
            c[type][index].type = "barrier";
            break;
        case "point_source":
            c[type][index].type = "point";
            break;
        case "parallel_source":
            c[type][index].type = "parallel";
            break;
    }
    utils.reload_element_settings(c, type, index);
    c.update_light_path();
}).on("input", "#element-settings-grid > input", function() {
    const type = $("#element-settings-title").data("type");
    const index = $("#element-settings-title").data("index");
    switch($(this).data("setting")) {
        case "name":
            if($(this).val()) {
                c[type][index].name = $(this).val();
                $(".element-list-item > button").filter(function() { return $(this).data("id") === c[type][index].id }).text($(this).val());
            }
            break;
        case "x":
            c[type][index].position[0] = +$(this).val();
            break;
        case "y":
            c[type][index].position[1] = +$(this).val();
            break;
        case "rotation":
            c[type][index].rotation = $(this).val();
            c[type][index].unit_vector = [Math.cos(+$(this).val() / 360 * TAU), Math.sin(+$(this).val() / 360 * TAU)];
            break;
        case "focal_length":
            if ($(this).val() > 0) {
                if ($("#element-settings-select-type").val() === "concave_lens" || $("#element-settings-select-type").val() === "convex_mirror") {
                    c[type][index].focal_length = -$(this).val();
                } else {
                    c[type][index].focal_length = +$(this).val();
                }
            }
            break;
        case "size":
            if ($(this).val() > 0) {
                c[type][index].size = +$(this).val();
            }
            break;
        case "density":
            if ($(this).val() > 0) {
                c[type][index].density = +$(this).val();
            }
            break;
        case "angle":
            if ($(this).val() >= 0 && $(this).val() <= 360) {
                c[type][index].angle = $(this).val();
            }
            break;
    }
    c.update_light_path();
}).on("click", "#element-center", function() {
    const type = $("#element-settings-title").data("type");
    const index = $("#element-settings-title").data("index");
    utils.center_element(c, c[type][index].id);
}).on("click", "#element-delete", () => {
    const type = $("#element-settings-title").data("type");
    const index = $("#element-settings-title").data("index");
    utils.delete_element(c, c[type][index].id);
});

$("#general-settings-icon").on("click", function() {
    $("#general-settings").toggleClass("invisible");
});

$(".general-settings-section-grid > input").on("change", function() {
    if ($(this).parent().data("setting_type") === "ray_rendering") {
        if (+$(this).val() < 0) {
            $(this).val(c[$(this).data("setting")]);
            return;
        }
        if ($(this).data("setting") === "fill_length" && +$(this).val() === 0 && +$(this).val() + c.sep_length === 0) {
            $(this).val(c[$(this).data("setting")]);
            return;
        }
        if ($(this).data("setting") === "sep_length" && +$(this).val() === 0 && +$(this).val() + c.fill_length === 0) {
            $(this).val(c[$(this).data("setting")]);
            return;
        }
        c[$(this).data("setting")] = +$(this).val();
        c.update_light_path();
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
    $("#input-open").click();
});

$("#input-open").on("change", function(event) {
    const file = event.target.files[0];
    if (!file) return;
    $(this).val("");

    storage.read_project(file).then(new_c => {
        if (new_c !== null) {
            c.destroy();
            c = new_c;
            c.update_light_path();
            c.activate();
        }
        c.render_frame();
    });
});
