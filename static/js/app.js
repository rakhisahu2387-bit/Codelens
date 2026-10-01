// ========================================
// CodeLens JavaScript
// ========================================


// ----------------------------------------
// Helper
// ----------------------------------------

function getElement(id) {
    return document.getElementById(id);
}


// ========================================
// DARK MODE
// ========================================

getElement("themeButton").addEventListener(
    "click",
    function () {

        document.body.classList.toggle("dark");

    }
);


// ========================================
// CLEAR
// ========================================

getElement("clearButton").addEventListener(
    "click",
    function () {

        getElement("codeInput").value = "";

        getElement("fileName").textContent =
            "No file selected";

        resetResults();

    }
);


// ========================================
// FILE UPLOAD
// ========================================

getElement("chooseFileButton").addEventListener(
    "click",
    function () {

        getElement("fileInput").click();

    }
);


getElement("fileInput").addEventListener(
    "change",
    async function (event) {

        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const code = await file.text();

        getElement("codeInput").value = code;

        getElement("fileName").textContent =
            "Selected: " + file.name;

    }
);

// ========================================
// STORE LAST ANALYSIS
// ========================================

let lastAnalysis = null;
// ========================================
// ANALYZE
// ========================================

getElement("analyzeButton").addEventListener(
    "click",
    async function () {

        const code =
            getElement("codeInput").value;


        if (!code.trim()) {

            alert(
                "Please enter or upload Python code first."
            );

            return;
        }


        const button =
            getElement("analyzeButton");


        button.textContent =
            "Analyzing...";


        button.disabled = true;


        try {

            const response =
                await fetch("/analyze", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        code: code
                    })

                });


            const data =
                await response.json();

                lastAnalysis = data;


            // ------------------------------
            // BACKEND ERROR
            // ------------------------------

            if (data.error) {

                alert(data.error);

                return;

            }


            // =================================
            // BASIC METRICS
            // =================================

            getElement("lines").textContent =
                data.lines;

            getElement("functions").textContent =
                data.functions;

            getElement("variables").textContent =
                data.variables;

            getElement("loops").textContent =
                data.loops;

            getElement("comments").textContent =
                data.comments;

            getElement("classes").textContent =
                data.classes;

            getElement("complexity").textContent =
                data.complexity;

            getElement("nesting").textContent =
                data.max_nesting;


            // =================================
            // PROGRAM STRUCTURE
            // =================================

            getElement("imports").textContent =
                data.imports;

            getElement("ifStatements").textContent =
                data.if_statements;

            getElement("elifStatements").textContent =
                data.elif_statements;

            getElement("elseStatements").textContent =
                data.else_statements;

            getElement("forLoops").textContent =
                data.for_loops;

            getElement("whileLoops").textContent =
                data.while_loops;

            getElement("nestedLoops").textContent =
                data.nested_loops;

            getElement("tryExcept").textContent =
                data.try_except;


            // =================================
            // COMPLEXITY
            // =================================

            getElement("complexityLarge")
                .textContent =
                data.complexity;

            getElement("nestingLarge")
                .textContent =
                data.max_nesting;


            let explanation;


            if (data.complexity <= 5) {

                explanation =
                    "Low complexity. The code contains " +
                    "relatively few decision points and " +
                    "should be easier to understand.";

            }

            else if (data.complexity <= 10) {

                explanation =
                    "Moderate complexity. The code contains " +
                    "several decision points or loops. " +
                    "Consider keeping the logic simple.";

            }

            else {

                explanation =
                    "High complexity. The code contains " +
                    "many decision points or loops. " +
                    "Consider dividing the logic into smaller functions.";

            }


            explanation +=
                " Maximum nesting depth: " +
                data.max_nesting + ".";


            getElement("complexityExplanation")
                .textContent =
                explanation;


            // =================================
            // CODE STRUCTURE
            // =================================

            const structure =
                getElement("structure");


            if (data.structure.length === 0) {

                structure.textContent =
                    "No functions or classes detected.";

            }

            else {

                structure.innerHTML =
                    data.structure.map(function (item) {

                        return `
                            <div class="structure-item">

                                <strong>
                                    ${item.type}
                                </strong>

                                <span>
                                    ${item.name}
                                </span>

                                <small>
                                    Line ${item.line}
                                </small>

                            </div>
                        `;

                    }).join("");

            }


            // =================================
            // FUNCTION DETAILS
            // =================================

            const functionDetails =
                getElement("functionDetails");


            if (data.function_details.length === 0) {

                functionDetails.textContent =
                    "No functions detected.";

            }

            else {

                functionDetails.innerHTML =
                    data.function_details.map(
                        function (item) {

                            return `
                                <div class="structure-item">

                                    <strong>
                                        ${item.name}
                                    </strong>

                                    <span>
                                        ${item.length} lines
                                    </span>

                                    <small>
                                        Line ${item.line}
                                    </small>

                                </div>
                            `;

                        }
                    ).join("");

            }


            // =================================
            // UNUSED VARIABLES
            // =================================

            const unused =
                getElement("unusedVariables");


            if (data.unused_variables.length === 0) {

                unused.innerHTML =
                    `<div class="success-message">
                        ✓ No unused variables detected.
                     </div>`;

            }

            else {

                unused.innerHTML =
                    data.unused_variables.map(
                        function (variable) {

                            return `
                                <div class="warning">
                                    ⚠ ${variable}
                                </div>
                            `;

                        }
                    ).join("");

            }


            // =================================
            // CODE QUALITY
            // =================================

            const suggestions =
                getElement("suggestions");


            suggestions.innerHTML =
                data.suggestions.map(
                    function (suggestion) {

                        return `
                            <div class="suggestion">
                                <span>💡</span>
                                ${suggestion}
                            </div>
                        `;

                    }
                ).join("");
                generateReport(data);



        }

        
        catch (error) {

            console.error(error);

            alert(
                "Could not connect to CodeLens. " +
                "Make sure the Flask server is running."
            );

        }


        finally {

            button.textContent =
                "▶ Analyze Code";

            button.disabled = false;

        }

    }
);


// ========================================
// RESET RESULTS
// ========================================

function resetResults() {

    const ids = [

        "lines",
        "functions",
        "variables",
        "loops",
        "comments",
        "classes",
        "complexity",
        "nesting",

        "imports",
        "ifStatements",
        "elifStatements",
        "elseStatements",

        "forLoops",
        "whileLoops",
        "nestedLoops",
        "tryExcept"

    ];


    ids.forEach(function (id) {

        getElement(id).textContent = "—";

    });


    getElement("complexityLarge")
        .textContent = "—";


    getElement("nestingLarge")
        .textContent = "—";


    getElement("structure").textContent =
        "Analyze your code to see its structure.";


    getElement("functionDetails").textContent =
        "Analyze your code to see function details.";


    getElement("unusedVariables").textContent =
        "No analysis performed.";


    getElement("suggestions").textContent =
        "Run CodeLens analysis to get " +
        "code-quality suggestions.";


    getElement("complexityExplanation").textContent =
        "Analyze your code to get a complexity explanation.";

}
// ========================================
// SIDEBAR NAVIGATION
// ========================================

const dashboardNav =
    getElement("dashboardNav");

const analysisNav =
    getElement("analysisNav");

const reportsNav =
    getElement("reportsNav");

const settingsNav =
    getElement("settingsNav");

const navItems =
    document.querySelectorAll(".nav-item");


// ----------------------------------------
// Change active sidebar item
// ----------------------------------------

function setActiveNav(activeItem) {

    navItems.forEach(function (item) {

        item.classList.remove("active");

    });

    activeItem.classList.add("active");
}


// ----------------------------------------
// Dashboard
// ----------------------------------------

dashboardNav.addEventListener(
    "click",
    function () {

        setActiveNav(dashboardNav);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


// ----------------------------------------
// Code Analysis
// ----------------------------------------

analysisNav.addEventListener(
    "click",
    function () {

        setActiveNav(analysisNav);

        getElement("codeAnalysisSection")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }
);


// ----------------------------------------
// Reports
// ----------------------------------------

reportsNav.addEventListener(
    "click",
    function () {

        setActiveNav(reportsNav);

        getElement("reportsSection")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }
);


// ----------------------------------------
// Settings
// ----------------------------------------

settingsNav.addEventListener(
    "click",
    function () {

        setActiveNav(settingsNav);

        document.body.classList.toggle("dark");

    }
);

// ========================================
// GENERATE REPORT
// ========================================

function generateReport(data) {

    let complexityLevel;


    if (data.complexity <= 5) {

        complexityLevel = "Low";

    }

    else if (data.complexity <= 10) {

        complexityLevel = "Moderate";

    }

    else {

        complexityLevel = "High";

    }


    const warningCount =
        data.suggestions.length;


    // ------------------------------------
    // STATUS
    // ------------------------------------

    getElement("reportStatus")
        .textContent =
        complexityLevel + " Complexity";


    getElement("reportComplexity")
        .textContent =
        complexityLevel;


    getElement("reportFunctions")
        .textContent =
        data.functions;


    getElement("reportClasses")
        .textContent =
        data.classes;


    getElement("reportWarnings")
        .textContent =
        warningCount;


    // ------------------------------------
    // REPORT TEXT
    // ------------------------------------

    let report = "";


    report +=
        "CodeLens Analysis Report\n";

    report +=
        "=========================\n\n";


    report +=
        "Code Statistics\n";

    report +=
        "---------------\n";

    report +=
        "Lines: " +
        data.lines +
        "\n";

    report +=
        "Functions: " +
        data.functions +
        "\n";

    report +=
        "Classes: " +
        data.classes +
        "\n";

    report +=
        "Variables: " +
        data.variables +
        "\n";

    report +=
        "Comments: " +
        data.comments +
        "\n\n";


    report +=
        "Program Structure\n";

    report +=
        "-----------------\n";

    report +=
        "Imports: " +
        data.imports +
        "\n";

    report +=
        "If statements: " +
        data.if_statements +
        "\n";

    report +=
        "Elif statements: " +
        data.elif_statements +
        "\n";

    report +=
        "Else statements: " +
        data.else_statements +
        "\n";

    report +=
        "For loops: " +
        data.for_loops +
        "\n";

    report +=
        "While loops: " +
        data.while_loops +
        "\n";

    report +=
        "Nested loops: " +
        data.nested_loops +
        "\n";

    report +=
        "Try/Except handlers: " +
        data.try_except +
        "\n\n";


    report +=
        "Complexity\n";

    report +=
        "----------\n";

    report +=
        "Complexity score: " +
        data.complexity +
        "\n";

    report +=
        "Complexity level: " +
        complexityLevel +
        "\n";

    report +=
        "Maximum nesting: " +
        data.max_nesting +
        "\n\n";


    report +=
        "Unused Variables\n";

    report +=
        "----------------\n";


    if (data.unused_variables.length === 0) {

        report +=
            "None detected.\n";

    }

    else {

        data.unused_variables.forEach(
            function (variable) {

                report +=
                    "- " +
                    variable +
                    "\n";

            }
        );

    }


    report += "\n";


    report +=
        "Code Quality Suggestions\n";

    report +=
        "------------------------\n";


    data.suggestions.forEach(
        function (suggestion, index) {

            report +=
                (index + 1) +
                ". " +
                suggestion +
                "\n";

        }
    );


    // ------------------------------------
    // DISPLAY
    // ------------------------------------

    getElement("reportText")
        .textContent =
        report;

}

// ========================================
// DOWNLOAD REPORT
// ========================================

getElement("downloadReportButton")
    .addEventListener(
        "click",
        function () {

            if (!lastAnalysis) {

                alert(
                    "Please analyze your code first."
                );

                return;
            }


            let complexityLevel;


            if (lastAnalysis.complexity <= 5) {

                complexityLevel = "Low";

            }

            else if (lastAnalysis.complexity <= 10) {

                complexityLevel = "Moderate";

            }

            else {

                complexityLevel = "High";

            }


            let report =
                "CODELENS - CODE ANALYSIS REPORT\n";

            report +=
                "================================\n\n";


            report +=
                "STATISTICS\n";

            report +=
                "----------\n";

            report +=
                "Lines: " +
                lastAnalysis.lines +
                "\n";

            report +=
                "Functions: " +
                lastAnalysis.functions +
                "\n";

            report +=
                "Classes: " +
                lastAnalysis.classes +
                "\n";

            report +=
                "Variables: " +
                lastAnalysis.variables +
                "\n";

            report +=
                "Comments: " +
                lastAnalysis.comments +
                "\n\n";


            report +=
                "STRUCTURE\n";

            report +=
                "---------\n";

            report +=
                "Imports: " +
                lastAnalysis.imports +
                "\n";

            report +=
                "If statements: " +
                lastAnalysis.if_statements +
                "\n";

            report +=
                "Elif statements: " +
                lastAnalysis.elif_statements +
                "\n";

            report +=
                "Else statements: " +
                lastAnalysis.else_statements +
                "\n";

            report +=
                "For loops: " +
                lastAnalysis.for_loops +
                "\n";

            report +=
                "While loops: " +
                lastAnalysis.while_loops +
                "\n";

            report +=
                "Nested loops: " +
                lastAnalysis.nested_loops +
                "\n";

            report +=
                "Try/Except: " +
                lastAnalysis.try_except +
                "\n\n";


            report +=
                "COMPLEXITY\n";

            report +=
                "----------\n";

            report +=
                "Score: " +
                lastAnalysis.complexity +
                "\n";

            report +=
                "Level: " +
                complexityLevel +
                "\n";

            report +=
                "Maximum nesting: " +
                lastAnalysis.max_nesting +
                "\n\n";


            report +=
                "UNUSED VARIABLES\n";

            report +=
                "----------------\n";


            if (
                lastAnalysis.unused_variables.length === 0
            ) {

                report +=
                    "None detected.\n";

            }

            else {

                lastAnalysis.unused_variables.forEach(
                    function (variable) {

                        report +=
                            "- " +
                            variable +
                            "\n";

                    }
                );

            }


            report += "\n";


            report +=
                "CODE QUALITY SUGGESTIONS\n";

            report +=
                "------------------------\n";


            lastAnalysis.suggestions.forEach(
                function (suggestion, index) {

                    report +=
                        (index + 1) +
                        ". " +
                        suggestion +
                        "\n";

                }
            );


            // --------------------------------
            // CREATE FILE
            // --------------------------------

            const blob =
                new Blob(
                    [report],
                    {
                        type: "text/plain"
                    }
                );


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                "CodeLens_Report.txt";


            link.click();


            URL.revokeObjectURL(url);

        }
    );