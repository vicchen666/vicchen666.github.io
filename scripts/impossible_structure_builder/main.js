{
    // window.addEventListener("beforeunload", e => {
    //     e.preventDefault();
    //     e.returnValue = "";
    //     return "";
    // });

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
        c.selected_elements = { selected: [], hovered: -1 };
        c.preview_elements.beams.forEach(beam => beam.destroy());
        c.preview_elements = { vertices: [], beams: [], axes: [] };
        switch (c.tool_status.tool) {
            case "move":
                c.can_move_canvas = true;
                c.default_cursor = "move";
                break;
            case "delete-vertex":
                c.tool_status.status = "select_vertex";
                break;
            case "delete-beam":
                c.tool_status.status = "select_beam";
                break;
            case "add-vertex-click":
                c.tool_status.status = "add_vertex";
                break;
            case "extend-beam-vertex":
                c.tool_status.status = "select_vertex";
                break;
            case "extend-beam-length":
                c.tool_status.status = "select_vertex";
                break;
            case "connect-vertices":
                c.tool_status.status = "select_vertex";
                break;
            case "connect-vertex-along-axes":
                c.tool_status.status = "select_vertex";
                break;
        }
        c.render_frame();
    }
}