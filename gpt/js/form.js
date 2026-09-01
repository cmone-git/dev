// js/form.js
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();

    const steps = document.querySelectorAll(".client-form-step");
    const navItems = document.querySelectorAll(".client-step");
    const nextBtn = document.getElementById("nextBtn");
    const backBtn = document.getElementById("backBtn");
    const formActions = document.getElementById("formActions");
    const formAlert = document.getElementById("formAlert");
    const formAlertText = document.getElementById("formAlertText");
    const progressFill = document.getElementById("progressFill");
    const progressPercent = document.getElementById("progressPercent");
    const progressTitle = document.getElementById("progressTitle");
    const flowList = document.getElementById("flowList");
    const addFlowBtn = document.getElementById("addFlowBtn");
    const form = document.getElementById("requirementForm");
    const successStep = document.getElementById("successStep");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");

    const stepTitles = [
        "01 · Business", "02 · Workflow", "03 · App", "04 · Users",
        "05 · Admin", "06 · Client", "07 · Tracking", "08 · Integrations",
        "09 · Reports", "10 · Design", "11 · Review"
    ];

    let currentStep = 0;
    let savedFormData = null;
    let generatedRefId = "";

    function showAlert(msg) {
        formAlertText.textContent = msg;
        formAlert.classList.add("show");
        formAlert.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function hideAlert() {
        formAlert.classList.remove("show");
    }

    function updateStep(index) {
        hideAlert();

        steps.forEach((step, i) => step.classList.toggle("active", i === index));
        navItems.forEach((nav, i) => {
            nav.classList.remove("active", "completed");
            if (i === index) nav.classList.add("active");
            else if (i < index) nav.classList.add("completed");
        });

        const percent = Math.round(((index + 1) / steps.length) * 100);
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        progressTitle.textContent = stepTitles[index] || "";

        backBtn.style.visibility = index === 0 ? "hidden" : "visible";
        nextBtn.innerHTML = index === steps.length - 1 
            ? `Submit <i data-lucide="check" width="16" height="16"></i>` 
            : `Next <i data-lucide="arrow-right" width="16" height="16"></i>`;

        if (index === steps.length - 1) renderReviewSummary();
        if (window.lucide) window.lucide.createIcons();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function validateStep(index) {
        const requiredInputs = steps[index].querySelectorAll("input[required], select[required], textarea[required]");
        for (let input of requiredInputs) {
            if (input.type === "checkbox" && !input.checked) {
                showAlert("Please accept the required confirmation checkbox.");
                input.focus();
                return false;
            }
            if (!input.value.trim()) {
                const labelText = input.closest(".client-field")?.querySelector("label")?.innerText.replace("*", "").trim();
                showAlert(`Please fill in ${labelText || "all required fields"}.`);
                input.focus();
                return false;
            }
            if (input.type === "email" && !/^\S+@\S+\.\S+$/.test(input.value)) {
                showAlert("Please enter a valid email address.");
                input.focus();
                return false;
            }
        }
        return true;
    }

    // --- SUBMISSION TO FIREBASE ---
    async function handleFinalSubmission() {
        nextBtn.disabled = true;
        nextBtn.innerHTML = `Submitting...`;

        const rawData = new FormData(form);
        generatedRefId = "Dev/" + Math.floor(100000 + Math.random() * 900000) + "/4001";

        const dataObj = {
            referenceId: generatedRefId,
            submittedAt: serverTimestamp(),
            companyName: rawData.get("companyName") || "",
            businessType: rawData.get("businessType") || "",
            contactPerson: rawData.get("contactPerson") || "",
            designation: rawData.get("designation") || "",
            mobile: rawData.get("mobile") || "",
            email: rawData.get("email") || "",
            whatsapp: rawData.get("whatsapp") || "",
            website: rawData.get("website") || "",
            industry: rawData.get("industry") || "",
            branches: rawData.get("branches") || "",
            businessDescription: rawData.get("businessDescription") || "",
            currentWorkflow: rawData.get("currentWorkflow") || "",
            problems: rawData.get("problems") || "",
            automation: rawData.get("automation") || "",
            currentSoftware: rawData.get("currentSoftware") || "",
            dataSource: rawData.get("dataSource") || "",
            workflowSteps: rawData.getAll("flow[]").filter(step => step.trim() !== ""),
            modules: rawData.getAll("modules"),
            otherModules: rawData.get("otherModules") || "",
            users: rawData.getAll("users"),
            totalUsers: rawData.get("totalUsers") || "",
            adminUsers: rawData.get("adminUsers") || "",
            permissions: rawData.get("permissions") || "",
            adminFeatures: rawData.getAll("adminFeatures"),
            adminOther: rawData.get("adminOther") || "",
            clientFeatures: rawData.getAll("clientFeatures"),
            clientExperience: rawData.get("clientExperience") || "",
            requestCreator: rawData.get("requestCreator") || "",
            workAssigner: rawData.get("workAssigner") || "",
            dueDate: rawData.get("dueDate") || "",
            priority: rawData.get("priority") || "",
            assignment: rawData.get("assignment") || "",
            clientStatus: rawData.get("clientStatus") || "",
            trackingRequirements: rawData.get("trackingRequirements") || "",
            integrations: rawData.getAll("integrations"),
            otherIntegrations: rawData.get("otherIntegrations") || "",
            reports: rawData.getAll("reports"),
            otherReports: rawData.get("otherReports") || "",
            primaryColor: rawData.get("primaryColor") || "#16263F",
            secondaryColor: rawData.get("secondaryColor") || "#F4F5F7",
            themePreference: rawData.get("themePreference") || "",
            designStyle: rawData.getAll("designStyle"),
            backgroundPreference: rawData.get("backgroundPreference") || "",
            cardStyle: rawData.get("cardStyle") || "",
            iconStyle: rawData.get("iconStyle") || "",
            fontPreference: rawData.get("fontPreference") || "",
            fontSizePreference: rawData.get("fontSizePreference") || "",
            referenceApps: rawData.get("referenceApps") || "",
            designLinks: rawData.get("designLinks") || "",
            avoidDesign: rawData.get("avoidDesign") || "",
            designInstructions: rawData.get("designInstructions") || "",
            appName: rawData.get("appName") || "",
            appDomain: rawData.get("appDomain") || "",
            launchDate: rawData.get("launchDate") || "",
            priorityLevel: rawData.get("priorityLevel") || "Normal",
            additionalRequirements: rawData.get("additionalRequirements") || ""
        };

        savedFormData = dataObj;

        try {
            await addDoc(collection(db, "client_requirements"), dataObj);
        } catch (error) {
            console.error("Firestore submission error:", error);
        }

        // Show Success Step
        document.getElementById("referenceId").textContent = generatedRefId;
        form.style.display = "none";
        formActions.style.display = "none";
        const progress = document.querySelector(".client-progress");
        const intro = document.querySelector(".client-intro");
        if (progress) progress.style.display = "none";
        if (intro) intro.style.display = "none";
        successStep.classList.add("active");
        if (window.lucide) window.lucide.createIcons();
    }

    nextBtn.addEventListener("click", () => {
        if (!validateStep(currentStep)) return;

        if (currentStep < steps.length - 1) {
            currentStep++;
            updateStep(currentStep);
        } else {
            handleFinalSubmission();
        }
    });

    backBtn.addEventListener("click", () => {
        if (currentStep > 0) {
            currentStep--;
            updateStep(currentStep);
        }
    });

    // --- PDF GENERATOR ---
    downloadPdfBtn.addEventListener("click", () => {
        if (!savedFormData) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const data = savedFormData;

        let y = 40;
        const margin = 40;
        const pageHeight = doc.internal.pageSize.height;

        function checkPageBreak(spaceNeeded = 30) {
            if (y + spaceNeeded >= pageHeight - margin) {
                doc.addPage();
                y = 40;
            }
        }

        function printHeader(title) {
            checkPageBreak(35);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(22, 38, 63);
            doc.text(title, margin, y);
            y += 6;
            doc.setDrawColor(225, 229, 234);
            doc.line(margin, y, 555, y);
            y += 16;
        }

        function printRow(label, value) {
            if (!value || (Array.isArray(value) && value.length === 0)) return;
            const valStr = Array.isArray(value) ? value.join(", ") : String(value);
            checkPageBreak(20);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(112, 121, 133);
            doc.text(label, margin, y);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(23, 32, 45);
            const splitVal = doc.splitTextToSize(valStr, 330);
            doc.text(splitVal, margin + 140, y);
            y += (splitVal.length * 13) + 4;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(22, 38, 63);
        doc.text("CM DEVELOPERS", margin, y);
        y += 18;
        doc.setFontSize(10);
        doc.setTextColor(112, 121, 133);
        doc.text(`App Requirement Document · Ref ID: ${data.referenceId}`, margin, y);
        y += 24;

        printHeader("1. Business & Contact Information");
        printRow("Company Name:", data.companyName);
        printRow("Business Type:", data.businessType);
        printRow("Contact Person:", data.contactPerson);
        printRow("Designation:", data.designation);
        printRow("Mobile:", data.mobile);
        printRow("Email:", data.email);
        printRow("WhatsApp:", data.whatsapp);
        printRow("Industry:", data.industry);
        printRow("Description:", data.businessDescription);
        y += 10;

        printHeader("2. Workflow & Automation");
        printRow("Current Process:", data.currentWorkflow);
        printRow("Existing Problems:", data.problems);
        printRow("To Automate:", data.automation);
        printRow("Current Tools:", data.currentSoftware);
        printRow("Data Source:", data.dataSource);
        if (data.workflowSteps.length > 0) {
            printRow("Workflow Steps:", data.workflowSteps.map((s, i) => `${i + 1}. ${s}`).join("  |  "));
        }
        y += 10;

        printHeader("3. Application Modules & Permissions");
        printRow("Selected Modules:", data.modules);
        printRow("Other Modules:", data.otherModules);
        printRow("User Roles:", data.users);
        printRow("Total / Admin Users:", `${data.totalUsers || "-"} Total / ${data.adminUsers || "-"} Admins`);
        printRow("Admin Controls:", data.adminFeatures);
        printRow("Client Features:", data.clientFeatures);
        y += 10;

        printHeader("4. Tracking, Integrations & Reports");
        printRow("Who Assigns Work:", data.workAssigner);
        printRow("Tracking Details:", data.trackingRequirements);
        printRow("Integrations:", data.integrations);
        printRow("Reports Needed:", data.reports);
        y += 10;

        printHeader("5. Design & Final Preferences");
        printRow("Colours (Primary / Sec):", `${data.primaryColor} / ${data.secondaryColor}`);
        printRow("Theme & Font:", `${data.themePreference} | ${data.fontPreference}`);
        printRow("App Name:", data.appName);
        printRow("Target Launch Date:", data.launchDate);
        printRow("Project Priority:", data.priorityLevel);
        printRow("Extra Notes:", data.additionalRequirements);

        doc.save(`${(data.companyName || "App").replace(/[^a-z0-9]/gi, '_')}_Requirements.pdf`);
    });

    // Workflow list items dynamic builder
    if (addFlowBtn && flowList) {
        addFlowBtn.addEventListener("click", () => {
            const nextIdx = flowList.querySelectorAll(".client-flow-item").length + 1;
            const div = document.createElement("div");
            div.className = "client-flow-item";
            div.innerHTML = `
                <div class="client-flow-index">${nextIdx}</div>
                <input name="flow[]" placeholder="Example: Processing / Verification">
                <button type="button" class="client-remove-flow" aria-label="Remove step">×</button>
            `;
            flowList.appendChild(div);
        });

        flowList.addEventListener("click", (e) => {
            if (e.target.classList.contains("client-remove-flow")) {
                e.target.closest(".client-flow-item").remove();
                flowList.querySelectorAll(".client-flow-item").forEach((el, idx) => {
                    el.querySelector(".client-flow-index").textContent = idx + 1;
                });
            }
        });
    }

    // Color Pickers
    ["primary", "secondary"].forEach((name) => {
        const picker = document.getElementById(`${name}ColorPicker`);
        const text = document.getElementById(`${name}Color`);
        if (picker && text) {
            picker.addEventListener("input", () => text.value = picker.value);
            text.addEventListener("input", () => picker.value = text.value);
        }
    });

    function renderReviewSummary() {
        const container = document.getElementById("reviewContainer");
        const formData = new FormData(form);
        container.innerHTML = `
            <div class="client-review-card">
                <h4>Contact Details</h4>
                <div class="client-review-line"><span>Company</span><span>${formData.get("companyName") || "—"}</span></div>
                <div class="client-review-line"><span>Contact</span><span>${formData.get("contactPerson") || "—"}</span></div>
                <div class="client-review-line"><span>Mobile</span><span>${formData.get("mobile") || "—"}</span></div>
            </div>
            <div class="client-review-card">
                <h4>Selected Modules</h4>
                <div class="client-review-line"><span>Modules</span><span>${formData.getAll("modules").join(", ") || "None"}</span></div>
            </div>
        `;
    }

    updateStep(0);
});
