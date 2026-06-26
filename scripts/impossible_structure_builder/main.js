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
        c.selected_tool = $(this).data("tool");
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
        c.selected_tool = $(this).data("tool");
        select_tool();
    });

    function select_tool() {
        c.can_move_canvas = false;
        c.selected_element = { selected: [], hovered: -1, selected_axes: [], hovered_axis: -1 };
        c.can_select_elements = new Set();
        switch (c.selected_tool) {
            case "move":
                c.can_move_canvas = true;
                $("#main-canvas").css("cursor", "move");
                break;
            case "add-vertex-click":
                $("#main-canvas").css("cursor", "pointer");
                break;
            case "extend-beam-vertex":
                c.tool_status = "select_vertex";
                c.can_select_elements.add("vertex");
                $("#main-canvas").css("cursor", "pointer");
                break;
        }
        c.render_frame();
    }
}