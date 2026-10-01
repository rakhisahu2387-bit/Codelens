from flask import Flask, render_template, request, jsonify
import ast

app = Flask(__name__)


def analyze_code(code):

    result = {
        "lines": len(code.splitlines()),
        "functions": 0,
        "loops": 0,
        "variables": 0,
        "comments": 0,
        "complexity": 1,
        "max_nesting": 0,
        "classes": 0,
        "imports": 0,
        "if_statements": 0,
        "elif_statements": 0,
        "else_statements": 0,
        "try_except": 0,
        "for_loops": 0,
        "while_loops": 0,
        "nested_loops": 0,
        "unused_variables": [],
        "function_details": [],
        "structure": [],
        "suggestions": []
    }

    # -----------------------------
    # COMMENTS
    # -----------------------------

    result["comments"] = sum(
        1
        for line in code.splitlines()
        if line.strip().startswith("#")
    )

    # -----------------------------
    # PARSE PYTHON CODE
    # -----------------------------

    try:
        tree = ast.parse(code)
    except SyntaxError as error:
        return {
            "error": f"Syntax error on line {error.lineno}: {error.msg}"
        }

    variable_names = {}
    used_variables = set()

    complexity = 1
    max_nesting = 0
    current_loop_depth = 0

    # -----------------------------
    # CODE ANALYZER
    # -----------------------------

    class CodeAnalyzer(ast.NodeVisitor):

        def __init__(self):
            self.nesting = 0

        # -------------------------
        # FUNCTIONS
        # -------------------------

        def visit_FunctionDef(self, node):

            result["functions"] += 1

            # Function length
            function_length = (
                node.end_lineno - node.lineno + 1
                if hasattr(node, "end_lineno")
                else 1
            )

            result["function_details"].append({
                "name": node.name,
                "line": node.lineno,
                "length": function_length
            })

            result["structure"].append({
                "type": "Function",
                "name": node.name,
                "line": node.lineno
            })

            self.generic_visit(node)

        # -------------------------
        # CLASSES
        # -------------------------

        def visit_ClassDef(self, node):

            result["classes"] += 1

            result["structure"].append({
                "type": "Class",
                "name": node.name,
                "line": node.lineno
            })

            self.generic_visit(node)

        # -------------------------
        # IMPORTS
        # -------------------------

        def visit_Import(self, node):

            result["imports"] += 1
            self.generic_visit(node)

        def visit_ImportFrom(self, node):

            result["imports"] += 1
            self.generic_visit(node)

        # -------------------------
        # IF
        # -------------------------

        def visit_If(self, node):

            nonlocal complexity

            result["if_statements"] += 1
            complexity += 1

            self.nesting += 1

            update_nesting()

            # Detect elif
            if isinstance(node.orelse, list):
                if len(node.orelse) == 1:
                    if isinstance(node.orelse[0], ast.If):
                        result["elif_statements"] += 1

            # Detect else
            if node.orelse:
                if not (
                    len(node.orelse) == 1
                    and isinstance(node.orelse[0], ast.If)
                ):
                    result["else_statements"] += 1

            self.generic_visit(node)

            self.nesting -= 1

        # -------------------------
        # FOR LOOP
        # -------------------------

        def visit_For(self, node):

            nonlocal complexity
            nonlocal current_loop_depth

            result["for_loops"] += 1
            result["loops"] += 1

            complexity += 1

            current_loop_depth += 1

            if current_loop_depth >= 2:
                result["nested_loops"] += 1

            self.nesting += 1

            update_nesting()

            self.generic_visit(node)

            self.nesting -= 1
            current_loop_depth -= 1

        # -------------------------
        # WHILE LOOP
        # -------------------------

        def visit_While(self, node):

            nonlocal complexity
            nonlocal current_loop_depth

            result["while_loops"] += 1
            result["loops"] += 1

            complexity += 1

            current_loop_depth += 1

            if current_loop_depth >= 2:
                result["nested_loops"] += 1

            self.nesting += 1

            update_nesting()

            self.generic_visit(node)

            self.nesting -= 1
            current_loop_depth -= 1

        # -------------------------
        # TRY / EXCEPT
        # -------------------------

        def visit_Try(self, node):

            result["try_except"] += len(node.handlers)

            self.generic_visit(node)

        # -------------------------
        # VARIABLES
        # -------------------------

        def visit_Name(self, node):

            if isinstance(node.ctx, ast.Store):

                variable_names[node.id] = node.lineno

            elif isinstance(node.ctx, ast.Load):

                used_variables.add(node.id)

            self.generic_visit(node)

    # -----------------------------
    # NESTING FUNCTION
    # -----------------------------

    def update_nesting():

        nonlocal max_nesting

        if analyzer.nesting > max_nesting:
            max_nesting = analyzer.nesting

    # -----------------------------
    # RUN ANALYZER
    # -----------------------------

    analyzer = CodeAnalyzer()

    analyzer.visit(tree)

    # -----------------------------
    # VARIABLES
    # -----------------------------

    result["variables"] = len(variable_names)

    # Find variables that were assigned but never used
    for variable in variable_names:

        if variable not in used_variables:

            result["unused_variables"].append(
                variable
            )

    # -----------------------------
    # COMPLEXITY
    # -----------------------------

    result["complexity"] = complexity

    result["max_nesting"] = max_nesting

    # -----------------------------
    # CODE QUALITY WARNINGS
    # -----------------------------

    if result["comments"] == 0:

        result["suggestions"].append(
            "No comments found. Add comments for important logic."
        )

    if result["max_nesting"] >= 3:

        result["suggestions"].append(
            "Deep nesting detected. Consider simplifying nested conditions or loops."
        )

    if result["nested_loops"] > 0:

        result["suggestions"].append(
            "Nested loops detected. They may increase execution time."
        )

    if result["functions"] == 0 and result["lines"] > 15:

        result["suggestions"].append(
            "Large code without functions. Consider breaking the code into smaller functions."
        )

    if result["unused_variables"]:

        result["suggestions"].append(
            "Unused variables detected: "
            + ", ".join(result["unused_variables"])
        )

    # Function length warning
    for function in result["function_details"]:

        if function["length"] > 30:

            result["suggestions"].append(
                f"Function '{function['name']}' is {function['length']} lines long. "
                "Consider breaking it into smaller functions."
            )

    if result["try_except"] == 0 and result["loops"] > 0:

        result["suggestions"].append(
            "Consider handling possible errors using try/except where appropriate."
        )

    if result["complexity"] <= 5:

        result["suggestions"].append(
            "Complexity is relatively low. The code structure is easy to follow."
        )

    elif result["complexity"] <= 10:

        result["suggestions"].append(
            "Moderate complexity detected. Consider simplifying some conditions."
        )

    else:

        result["suggestions"].append(
            "High complexity detected. Consider splitting the logic into smaller functions."
        )

    # -----------------------------
    # DEFAULT MESSAGE
    # -----------------------------

    if not result["suggestions"]:

        result["suggestions"].append(
            "No basic code-quality problems were detected."
        )

    return result


# =================================
# HOME PAGE
# =================================

@app.route("/")
def home():

    return render_template("index.html")


# =================================
# ANALYZE API
# =================================

@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.get_json()

    code = data.get("code", "")

    result = analyze_code(code)

    return jsonify(result)


# =================================
# START SERVER
# =================================

if __name__ == "__main__":

    app.run(debug=True)