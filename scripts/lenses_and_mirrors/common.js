{
    $(".tab").on("click", function() {
        const index = $(this).index();
        $(this).css("border-width", "0"); 
        $(this).css("cursor", "default");
        switch (index) {
            case 0:
                $(this).siblings().css({"border-width": "0 0 1px 1px", "cursor": "pointer"});
                $("#main-sidebar > :nth-child(2)").removeClass("invisible");
                $("#main-sidebar > :nth-child(3)").addClass("invisible");
                break;
            case 1:
                $(this).siblings().css({"border-width": "0 1px 1px 0", "cursor": "pointer"});
                $("#main-sidebar > :nth-child(2)").addClass("invisible");
                $("#main-sidebar > :nth-child(3)").removeClass("invisible");
                break;
        }
    });

    $("#main-sidebar > div:nth-child(2) > div").on("click", function() {
        const element = {id: c.element_id, name:"New Element", type: "lens", position: [0, 0], rotation: 90, unit_vector: [0, 1], focal_length: 200, size: 400, density: 10};
        switch($(this).index()) {
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
            case 5:
                element.type = "barrier";
                break;
            case 6:
                element.type = "point";
                element.size = "40";
                break;
            case 7:
                element.type = "parallel";
                break;
        }

        c.add_element($(this).data("type"), element);

        $("#main-sidebar > div:nth-child(3)").append($("<div>").data("id", c.element_id++).text("New Element"));
    });

    $("#main-sidebar > div:nth-child(3)").on("click", "> div", function() {
        if (+$(this).data("id") === c.selected_element.selected) {
            c.selected_element.selected = -1;
            $(this).css("color","");
            $("#element-settings").addClass("invisible");
        } else {
            c.selected_element.selected = +$(this).data("id");
            $(this).siblings().css("color","");
            $(this).css("color","limegreen");
            const element = c.optical_elements.find(e => e.id === c.selected_element.selected);
            if (element) {
                reload_settings("optical_element", element);
            } else {
                reload_settings("light_source", c.light_sources.find(e => e.id === c.selected_element.selected));
            }
        }
    }).on("mouseenter", "> div", function () {
        c.selected_element.hovered = +$(this).data("id");
    }).on("mouseleave", "> div", function() {
        c.selected_element.hovered = -1;
    });

    function reload_settings(type, element) {
        const optical_elements = ["Convex Lens", "Concave Lens", "Convex Mirror", "Concave Mirror", "Flat Mirror", "Barrier"];
        const light_sources = ["Point Source", "Parallel Source"];
        const settings = $("#element-settings").children("div");
        $("#element-settings").removeClass("invisible");
        settings.text("");
        if (type === "optical_element") {
            settings.append($("<div>").css("font-size", "40px").text("Optical Element"));
            settings.append($("<select>").data("setting", type));
            optical_elements.forEach(e => {
                settings.children("select").append($("<option>").attr("value", e.toLowerCase().replace(" ", "_")).text(e));
            });
        } else {
            settings.append($("<div>").css("font-size", "40px").text("Light Source"));
            settings.append($("<select>").data("setting", type));
            light_sources.forEach(e => {
                settings.children("select").append($("<option>").attr("value", e.toLowerCase().replace(" ", "_")).text(e));
            });
        }
        switch (element.type) {
            case "lens":
                settings.children("select").val(element.focal_length > 0 ? "convex_lens" : "concave_lens");
                break;
            case "mirror":
                settings.children("select").val(element.focal_length > 0 ? "concave_mirror" : "convex_mirror");
                break;
            case "point":
            case "parallel":
                settings.children("select").val(`${element.type}_source`);
                break;
            default:
                settings.children("select").val(element.type);
        }

        const settings_grid = $("<div>").appendTo(settings);
        for (const [key, value] of Object.entries(element)) {
            if (c.elements_settings[element.type].includes(key)) {
                switch (key) {
                    case "name":
                        settings_grid.append($("<div>").text("Name"));
                        settings_grid.append($("<input>").attr("type", "text").data("setting", "name").val(value));
                        break;
                    case "position":
                        settings_grid.append($("<div>").text("X"));
                        settings_grid.append($("<input>").attr("type", "number").data("setting", "x").val(value[0]));
                        settings_grid.append($("<div>").text("Y"));
                        settings_grid.append($("<input>").attr("type", "number").data("setting", "y").val(value[1]));
                        break;
                    case "rotation":
                        settings_grid.append($("<div>").text("Rotation (deg)"));
                        settings_grid.append($("<input>").attr("type", "number").data("setting", "rotation").val(value));
                        break;
                    case "focal_length":
                        settings_grid.append($("<div>").text("Focal Length"));
                        settings_grid.append($("<input>").attr("type", "number").data("setting", "focal_length").val(Math.abs(value)));
                        break;
                    case "size":
                        settings_grid.append($("<div>").text("Size"));
                        settings_grid.append($("<input>").attr("type", "number").data("setting", "size").val(value));
                        break;
                    case "density":
                        settings_grid.append($("<div>").text("Density"));
                        settings_grid.append($("<input>").attr("type", "number").data("setting", "density").val(value));
                        break;
                }
            }
        }
    }

    $("#element-settings > div").on("change", "> select", function() {
        const type = $(this).data("setting");
        const index = c[type + "s"].findIndex(e => e.id === c.selected_element.selected);
        switch($(this).val()) {
            case "concave_lens":
                c[type + "s"][index].focal_length = -Math.abs(c[type + "s"][index].focal_length);
                c[type + "s"][index].type = "lens";
                break;
            case "convex_lens":
                c[type + "s"][index].focal_length = Math.abs(c[type + "s"][index].focal_length);
                c[type + "s"][index].type = "lens";
                break;
            case "concave_mirror":
                c[type + "s"][index].focal_length = Math.abs(c[type + "s"][index].focal_length);
                c[type + "s"][index].type = "mirror";
                break;
            case "convex_mirror":
                c[type + "s"][index].focal_length = -Math.abs(c[type + "s"][index].focal_length);
                c[type + "s"][index].type = "mirror";
                break;
            case "flat_mirror":
                c[type + "s"][index].type = "flat_mirror";
                break;
            case "barrier":
                c[type + "s"][index].type = "barrier";
                break;
            case "point_source":
                c[type + "s"][index].type = "point";
                break;
            case "parallel_source":
                c[type + "s"][index].type = "parallel";
                break;
        }
        reload_settings(type, c[type + "s"][index]);
        c.update_light_path();
    });
}