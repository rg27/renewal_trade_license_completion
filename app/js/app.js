/* ---------------------------------------------------------------
   Renewal Trade License: configuration
   CHANGE THESE to match your Deluge functions in Zoho CRM.
--------------------------------------------------------------- */
const LOAD_FUNCTION   = "renewal_tl_completion_data";                    // returns the existing license data
const UPDATE_FUNCTION = "renewal_license_completion_update_trade_license"; // saves the renewal

let currentRecordId, currentLfId, currentAccountId, triggeredByUser = null;

/* ---------------------------------------------------------------
   Dropdown options
   (LICENSE_TYPES and LICENSE_ACTIVITIES are the full fallback lists;
    they get narrowed to the jurisdiction's children after load)
--------------------------------------------------------------- */
const LICENSE_TYPES = [
    "Holding Trade License", "Regular Trade License", "Freelancer License",
    "Media Trade License", "Publishing License", "Women Trade License",
    "Trader License", "Entrepreneur License", "Trade License FFL",
    "New Year 2023 Package", "RAMADAN 2023", "SUMMER 2023",
    "Exclusive Package 2023", "Innovation Hub", "Tripple Pack"
];

const visaPackages = () => {
    const list = [];

    // Visa licenses: Zero, then 1 to 30
    list.push("Zero Visa License");
    for (let i = 1; i <= 30; i++) list.push(`${i} Visa License`);

    // Freelance permits
    list.push("Zero Visa Freelance Permit", "1 Visa Freelance Permit");

    // Others
    list.push("Holding", "Based on Office Size");

    return list;
};

const LICENSE_ACTIVITIES = [
    "Commercial Trading Activities", "Consultancy Activities", "E-Commerce",
    "Education Consulting and Services Activities", "Education Training Activities",
    "General Trading Activities", "Holding Activities", "Services Activities"
];

const LICENSE_DURATIONS = ["1 Year", "2 Years", "3 Years", "4 Years", "5 Years", "10 Years"];

// Same values and order as the Zoho Country picklist
const COUNTRIES = "Åland Islands|Afghanistan|Akrotiri|Albania|Algeria|American Samoa|Andorra|Angola|Anguilla|Antarctica|Antigua and Barbuda|Argentina|Armenia|Aruba|Ashmore and Cartier Islands|Australia|Austria|Azerbaijan|Bahrain|Bangladesh|Barbados|Bassas Da India|Belarus|Belgium|Belize|Benin|Bermuda|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Bouvet Island|Brazil|British Indian Ocean Territory|British Virgin Islands|Brunei|Bulgaria|Burkina Faso|Burma|Burundi|Cambodia|Cameroon|Canada|Cape Verde|Caribbean Netherlands|Cayman Islands|Central African Republic|Chad|Chile|China|Christmas Island|Clipperton Island|Cocos (Keeling) Islands|Colombia|Comoros|Cook Islands|Coral Sea Islands|Costa Rica|Cote D'Ivoire|Croatia|Cuba|Curaçao|Cyprus|Czech Republic|Democratic Republic of the Congo|Denmark|Dhekelia|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Ethiopia|Europa Island|Falkland Islands (Islas Malvinas)|Faroe Islands|Federated States of Micronesia|Fiji|Finland|France|French Guiana|French Polynesia|French Southern and Antarctic Lands|Gabon|Gaza Strip|Georgia|Germany|Ghana|Gibraltar|Glorioso Islands|Greece|Greenland|Grenada|Guadeloupe|Guam|Guatemala|Guernsey|Guinea|GuineaBissau|Guyana|Haiti|Heard Island and Mcdonald Islands|Holy See (Vatican City)|Honduras|Hong Kong|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Isle of Man|Israel|Italy|Jamaica|Jan Mayen|Japan|Jersey|Jordan|Juan De Nova Island|Kazakhstan|Kenya|Kiribati|Kosovo|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Macau|Macedonia|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Martinique|Mauritania|Mauritius|Mayotte|Mexico|Moldova|Monaco|Mongolia|Montenegro|Montserrat|Morocco|Mozambique|Myanmar|Namibia|Nauru|Navassa Island|Nepal|Netherlands|Netherlands Antilles|New Caledonia|New Zealand|Nicaragua|Niger|Nigeria|Niue|Norfolk Island|North Korea|Northern Mariana Islands|Norway|Oman|Pakistan|Palau|Palestine|Panama|Papua New Guinea|Paracel Islands|Paraguay|Peru|Philippines|Pitcairn Islands|Poland|Portugal|Puerto Rico|Qatar|Republic of the Congo|Reunion|Romania|Russia|Rwanda|Saint Barthelemy|Saint Helena|Saint Kitts and Nevis|Saint Lucia|Saint Martin|Saint Pierre and Miquelon|Saint Vincent and the Grenadines|Samoa|San Marino|Sao Tome and Principe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Sint Maarten|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Georgia and the South Sandwich Islands|South Korea|South Sudan|Spain|Spratly Islands|Sri Lanka|Sudan|Suriname|Svalbard|Swaziland|Sweden|Switzerland|Syria|Taiwan|Tajikistan|Tanzania|Thailand|The Bahamas|The Gambia|Timor-leste|Togo|Tokelau|Tonga|Trinidad and Tobago|Tromelin Island|Tunisia|Turkey|Turkmenistan|Turks and Caicos Islands|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Virgin Islands|Wake Island|Wallis and Futuna|West Bank|Western Sahara|Yemen|Zambia|Zimbabwe".split("|");

/* ---------------------------------------------------------------
   Field definitions
--------------------------------------------------------------- */
const LICENSE_FIELDS = [
    { key: "trade_license_name",        label: "Trade License Name",         type: "text",   required: true },
    { key: "license_registration_no", label: "License Registration Number", type: "text",   required: true },
    { key: "license_type",            label: "License Type",               type: "select", required: true, options: LICENSE_TYPES },
    { key: "license_package",         label: "License Package",            type: "select", required: true, col: 7, options: visaPackages() },
    { key: "license_duration",        label: "MY - License Duration",      type: "select", required: true, options: LICENSE_DURATIONS },
    {
        key: "multi_year_continuation",
        label: "Multi-Year Continuation?",
        type: "checkbox",
        required: false,
        pairWith: "license_duration",   // renders beside this field (75% / 25%)
        hint: "Check this box if this license renewal is a continuation of a Multi-Year. This means that this is an internal license renewal with IFZA. If you tick this box you can leave the license duration at 1-year."
    },
    { key: "license_activities",      label: "License Activities",         type: "multiselect", required: true, col: 7, options: LICENSE_ACTIVITIES },
    { key: "license_issuance_date",   label: "License Issuance Date",      type: "date",   required: true },
    { key: "license_start_date",      label: "License Start Date",         type: "date",   required: true },
    { key: "license_expiry_date",     label: "License Expiry Date",        type: "date",   required: true }
];

const ADDRESS_FIELDS = [
    { key: "street_address", label: "Street Address", type: "text",   required: true, span2: true },
    { key: "country",        label: "Country",        type: "select", required: true, options: COUNTRIES },
    { key: "city",           label: "City",           type: "text",   required: false },
    { key: "state",          label: "State",          type: "text",   required: false },
    { key: "code",           label: "Code",           type: "text",   required: false }
];

const ALL_FIELDS = [...LICENSE_FIELDS, ...ADDRESS_FIELDS];
const fieldByKey = (k) => ALL_FIELDS.find(f => f.key === k);

const WARN_ICON = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
const CHECK_ICON = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>';
const CHEVRON = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>';

const multiSelectState = {}; // key -> array of selected values

/* ---------------------------------------------------------------
   Rendering
--------------------------------------------------------------- */
const msItemsHtml = (options) => options.map(o => `
    <label class="ms-option"><input type="checkbox" class="ms-check" value="${o}"><span>${o}</span></label>`).join("");

function renderField(f) {
    const wrap = document.createElement("div");
    wrap.className = "field" + (f.full ? " full" : "") + (f.span2 ? " span-2" : "") + (f.col ? ` col-${f.col}` : "");

    const star = f.required ? ' <span class="asterisk">*</span>' : "";
    let control = "";

    if (f.type === "text") {
        control = `<input type="text" id="${f.key}" class="input" placeholder="Enter ${f.label.toLowerCase()}" autocomplete="off">`;
    } else if (f.type === "date") {
        control = `<input type="date" id="${f.key}" class="input">`;
    } else if (f.type === "select") {
        const opts = f.options.map(o => `<option value="${o}">${o}</option>`).join("");
        control = `<select id="${f.key}" class="input"><option value="">-- Select --</option>${opts}</select>`;
    } else if (f.type === "checkbox") {
        const hintAttr = f.hint ? ` title="${f.hint}"` : "";
        wrap.className = "field field-checkbox";
        wrap.innerHTML = `
            <label class="field-label" for="${f.key}" ${hintAttr.trim()}>${f.label}${star}</label>
            <label class="checkbox-wrap" for="${f.key}"${hintAttr}>
                <input type="checkbox" id="${f.key}" class="checkbox-input">
                <span class="checkbox-state" aria-hidden="true"></span>
            </label>`;
        return wrap;
    } else if (f.type === "multiselect") {
        control = `
          <div class="ms-wrap" id="${f.key}-wrap">
            <button type="button" id="${f.key}" class="input ms-btn">
              <span id="${f.key}-text" class="ms-text placeholder">-- Select activities --</span>${CHEVRON}
            </button>
            <div id="${f.key}-panel" class="ms-panel hidden">${msItemsHtml(f.options)}</div>
          </div>`;
    }

    wrap.innerHTML = `
      <label class="field-label" for="${f.key}">${f.label}${star}</label>
      ${control}
      <span id="${f.key}-error" class="error-msg hidden" role="alert">${WARN_ICON}<span class="error-text"></span></span>`;
    return wrap;
}

function renderForm() {
    const lic = document.getElementById("license-fields");
    const adr = document.getElementById("address-fields");

    LICENSE_FIELDS.forEach(f => {
        if (f.pairWith) return;   // rendered next to its partner below

        const partner = LICENSE_FIELDS.find(p => p.pairWith === f.key);
        if (!partner) { lic.appendChild(renderField(f)); return; }

        // Two fields sharing ONE grid cell: 75% main + 25% partner
        const pair = document.createElement("div");
        pair.className = "field field-pair";
        pair.append(renderField(f), renderField(partner));
        lic.appendChild(pair);
    });

    ADDRESS_FIELDS.forEach(f => adr.appendChild(renderField(f)));

    ALL_FIELDS.filter(f => f.type === "multiselect").forEach(setupMultiSelect);

    ALL_FIELDS.forEach(f => {
        if (f.type === "multiselect" || f.type === "checkbox") return;
        const el = document.getElementById(f.key);
        el.addEventListener(f.type === "select" ? "change" : "input", () => clearError(f));
    });
}

function refreshMultiSelect(f) {
    const panel = document.getElementById(`${f.key}-panel`);
    const text = document.getElementById(`${f.key}-text`);
    const selected = multiSelectState[f.key] || [];
    panel.querySelectorAll(".ms-check").forEach(cb => { cb.checked = selected.includes(cb.value); });
    const n = selected.length;
    text.textContent = n === 0 ? "-- Select activities --"
                     : n <= 2 ? selected.join(", ")
                     : `${n} activities selected`;
    text.classList.toggle("placeholder", n === 0);
}

function setupMultiSelect(f) {
    multiSelectState[f.key] = [];
    const btn = document.getElementById(f.key);
    const panel = document.getElementById(`${f.key}-panel`);

    btn.addEventListener("click", () => panel.classList.toggle("hidden"));

    // Event delegation: checkboxes are rebuilt when options are filtered,
    // so listen on the panel instead of on each checkbox
    panel.addEventListener("change", (e) => {
        if (!e.target.classList.contains("ms-check")) return;
        multiSelectState[f.key] = [...panel.querySelectorAll(".ms-check:checked")].map(c => c.value);
        refreshMultiSelect(f);
        if (multiSelectState[f.key].length > 0) clearError(f);
    });

    document.addEventListener("click", (e) => {
        if (!document.getElementById(`${f.key}-wrap`).contains(e.target)) panel.classList.add("hidden");
    });
}

/* ---------------------------------------------------------------
   Validation
--------------------------------------------------------------- */
function getValue(f) {
    if (f.type === "multiselect") return multiSelectState[f.key];
    if (f.type === "checkbox") return document.getElementById(f.key).checked;
    return document.getElementById(f.key).value.trim();
}

function setError(f, message) {
    document.getElementById(f.key).classList.add("input-error");
    const err = document.getElementById(`${f.key}-error`);
    err.querySelector(".error-text").textContent = message;
    err.classList.remove("hidden");
}

function clearError(f) {
    document.getElementById(f.key).classList.remove("input-error");
    document.getElementById(`${f.key}-error`).classList.add("hidden");
}

/* Add whole years to a YYYY-MM-DD string (clamps 29 Feb to 28 Feb on non-leap years) */
function addYears(dateStr, years) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const targetYear = y + years;
    const lastDay = new Date(targetYear, m, 0).getDate();
    const p = (n) => String(n).padStart(2, "0");
    return `${targetYear}-${p(m)}-${p(Math.min(d, lastDay))}`;
}

/* Required expiry = start + N years - 1 day
   e.g. 26/10/2026 + 1 year -> 25/10/2027 */
function maxExpiryDate(startStr, years) {
    const [y, m, d] = addYears(startStr, years).split("-").map(Number);
    const dt = new Date(y, m - 1, d - 1);
    const p = (n) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

/* YYYY-MM-DD -> DD/MM/YYYY for messages */
const formatDisplayDate = (s) => s.split("-").reverse().join("/");

function validateForm() {
    let firstInvalid = null;

    ALL_FIELDS.forEach(f => {
        if (f.type === "checkbox") return;
        clearError(f);
        const v = getValue(f);
        const empty = Array.isArray(v) ? v.length === 0 : !v;

        if (f.required && empty) {
            const verb = (f.type === "select" || f.type === "multiselect") ? "Please select" : "Please enter";
            setError(f, f.type === "date" ? `${f.label} is required.` : `${f.label} is required. ${verb} a value.`);
            if (!firstInvalid) firstInvalid = f;
        }
    });

    const start      = getValue(fieldByKey("license_start_date"));
    const expiry     = getValue(fieldByKey("license_expiry_date"));
    const duration   = getValue(fieldByKey("license_duration"));
    const isMultiYearContinuation = getValue(fieldByKey("multi_year_continuation"));
    const expiryField = fieldByKey("license_expiry_date");

    if (expiry) {   // empty case is already handled by the required check
        const today = toInputDate(new Date());
        let message = null;

        if (expiry <= today) {
            message = "Expiry date must be a future date.";
        } else if (start && expiry <= start) {
            message = "Expiry date must be after the start date.";
        } else if (start && duration && !isMultiYearContinuation) {
            const years = parseInt(duration, 10);   // "3 Years" -> 3
            if (years) {
                // The expiry must be exactly start + duration - 1 day
                const requiredExpiry = maxExpiryDate(start, years);
                if (expiry !== requiredExpiry) {
                    message = `Expiry date does not match the ${duration.toLowerCase()} license duration. The allowed date is ${formatDisplayDate(requiredExpiry)}.`;
                }
            }
        }

        if (message) {
            setError(expiryField, message);
            if (!firstInvalid) firstInvalid = expiryField;
        }
    }

    if (firstInvalid) {
        document.getElementById(firstInvalid.key).scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
    }
    return true;
}

/* ---------------------------------------------------------------
   Loader & Toast Notifications
--------------------------------------------------------------- */
function showLoader(text = "Saving renewal...") {
    document.getElementById("loader-text").textContent = text;
    const o = document.getElementById("loader-overlay");
    o.classList.remove("hidden");
    o.setAttribute("aria-hidden", "false");
}

function hideLoader() {
    const o = document.getElementById("loader-overlay");
    o.classList.add("hidden");
    o.setAttribute("aria-hidden", "true");
}

/* ---------------------------------------------------------------
   Toast Notifications (Top-Right with Top Animated Progress Bar)
--------------------------------------------------------------- */
function showToast(message, type = "success", duration = 4000, onClose = null) {
    const existing = document.getElementById("app-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "app-toast";
    toast.className = `toast ${type}`;

    const iconSvg = type === "success" ? CHECK_ICON : WARN_ICON;
    const titleText = type === "success" ? "Success" : "Action Required";

    toast.innerHTML = `
        <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
        <div class="toast-body">
            <div class="toast-icon-badge">
                ${iconSvg}
            </div>
            <div class="toast-content">
                <span class="toast-title">${titleText}</span>
                <span class="toast-text">${message}</span>
            </div>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-0.5rem) scale(0.96)";
        toast.style.transition = "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
        setTimeout(() => {
            toast.remove();
            if (typeof onClose === "function") onClose();
        }, 300);
    }, duration);
}

/* ---------------------------------------------------------------
   Zoho init
--------------------------------------------------------------- */
renderForm();

// Clear a stale expiry error when Start Date or Duration changes
["license_start_date", "license_duration"].forEach(key => {
    const evt = key === "license_duration" ? "change" : "input";
    document.getElementById(key).addEventListener(evt, () => clearError(fieldByKey("license_expiry_date")));
});

ZOHO.embeddedApp.on("PageLoad", async function (e) {
    await initializeWidget(e);
});

ZOHO.embeddedApp.init();

/* Map: key returned by the load function -> form field key */
const DATA_MAP = {
    tl_name:                      "trade_license_name",
    tl_reg_number:                "license_registration_no",
    tl_license_type:              "license_type",
    tl_license_package:           "license_package",
    tl_license_activities:        "license_activities",
    tl_license_issuance_date:     "license_issuance_date",
    tl_license_start_date:        "license_start_date",
    tl_license_expiry_date:       "license_expiry_date",
    tl_my_license_duration:       "license_duration",
    multi_year_continuation:      "multi_year_continuation",
    account_billing_street:       "street_address",
    account_billing_city:         "city",
    account_billing_state:        "state",
    account_billing_country:      "country",
    account_billing_code:         "code"
};

function resolveRecordId(e) {
    if (!e) return null;
    const idKeys = ["recordId", "record_id", "id", "applicationId", "application_id", "dealId", "prospectId", "entityId", "EntityId"];

    const fromObj = (o) => {
        if (o === null || o === undefined) return null;
        if (typeof o === "string" || typeof o === "number") return String(o);
        if (Array.isArray(o)) return o.length ? String(o[0]) : null;
        if (typeof o === "object") {
            for (const k of idKeys) {
                if (o[k]) return Array.isArray(o[k]) ? String(o[k][0]) : String(o[k]);
            }
        }
        return null;
    };

    return fromObj(e.EntityId) || fromObj(e.value) || fromObj(e.data) || fromObj(e);
}

function findDataObject(node, depth = 0) {
    if (node === null || node === undefined || depth > 6) return null;

    if (typeof node === "string") {
        const t = node.trim();
        if (t[0] === "{" || t[0] === "[") {
            try { return findDataObject(JSON.parse(t), depth + 1); } catch (err) { /* not JSON */ }
        }
        return null;
    }
    if (Array.isArray(node)) {
        for (const item of node) {
            const r = findDataObject(item, depth + 1);
            if (r) return r;
        }
        return null;
    }
    if (typeof node === "object") {
        if (Object.keys(DATA_MAP).some(k => k in node)) return node;
        for (const v of Object.values(node)) {
            const r = findDataObject(v, depth + 1);
            if (r) return r;
        }
    }
    return null;
}

function parseFunctionOutput(response) {
    return findDataObject(response);
}

function toInputDate(val) {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return String(val).slice(0, 10);
    const d = new Date(val);
    if (isNaN(d)) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function setSelectValue(el, val) {
    const match = [...el.options].find(o => o.value.toLowerCase() === String(val).trim().toLowerCase());
    if (match) {
        el.value = match.value;
    } else {
        const opt = new Option(val, val);
        el.add(opt);
        el.value = val;
    }
}

/* Replace a field's options with the jurisdiction's child options.
   Falls back to the full list if none were returned. */
function setFieldOptions(fieldKey, options) {
    const f = fieldByKey(fieldKey);
    const list = (Array.isArray(options) && options.length) ? options : f.options;

    if (f.type === "select") {
        const el = document.getElementById(f.key);
        el.innerHTML = `<option value="">-- Select --</option>` +
            list.map(o => `<option value="${o}">${o}</option>`).join("");
    } else if (f.type === "multiselect") {
        document.getElementById(`${f.key}-panel`).innerHTML = msItemsHtml(list);
        multiSelectState[f.key] = [];
        refreshMultiSelect(f);
    }
}

function populateForm(data) {
    Object.entries(DATA_MAP).forEach(([srcKey, fieldKey]) => {
        const f = fieldByKey(fieldKey);
        let val = data[srcKey];
        if (val === undefined || val === null) return;

        if (f.type === "multiselect") {
            if (typeof val === "string") val = val.split(",").map(x => x.trim()).filter(Boolean);
            const allowed = [...document.querySelectorAll(`#${f.key}-panel .ms-check`)].map(c => c.value);
            multiSelectState[f.key] = (Array.isArray(val) ? val : []).filter(v => allowed.includes(v));
            refreshMultiSelect(f);
            return;
        }
        if (val === "") return;

        const el = document.getElementById(f.key);
        if (f.type === "date") el.value = toInputDate(val);
        else if (f.type === "select") setSelectValue(el, val);
        else if (f.type === "checkbox") el.checked = Boolean(val);
        else el.value = val;
    });
}

async function initializeWidget(e) {
    showLoader("Loading license data...");
    console.log("PageLoad entity:", e);

    try {
        currentRecordId = resolveRecordId(e);
        if (!currentRecordId) {
            try {
                const pageInfo = await ZOHO.CRM.INTERACTION.getPageInfo();
                currentRecordId = pageInfo && pageInfo.recordId;
            } catch (pageErr) {
                console.warn("getPageInfo failed:", pageErr);
            }
        }
        console.log("currentRecordId:", currentRecordId);

        const userInfo = await ZOHO.CRM.CONFIG.getCurrentUser();
        if (userInfo && userInfo.users && userInfo.users.length > 0) {
            triggeredByUser = userInfo.users[0].full_name;
            const greetingEl = document.getElementById("user-greeting");
            greetingEl.textContent = `Hello ${triggeredByUser}!`;
            greetingEl.classList.add("visible");
        }

        ZOHO.CRM.UI.Resize({ height: "800", width: "960" });

        if (!currentRecordId) {
            hideLoader();
            showToast("The record ID was not received, so existing data could not be loaded.", "error", 4000);
            return;
        }

        try {
            const functionArgs = { "application_id": currentRecordId };
            console.log(`Executing '${LOAD_FUNCTION}' with parameters:`, functionArgs);

            const response = await ZOHO.CRM.FUNCTIONS.execute(LOAD_FUNCTION, {
                "arguments": JSON.stringify(functionArgs)
            });
            console.log(`'${LOAD_FUNCTION}' raw response:`, JSON.stringify(response, null, 2));

            const data = parseFunctionOutput(response);
            if (!data) {
                hideLoader();
                showToast("No license fields were found in the function response.", "error", 4000);
                return;
            }

            currentLfId = data.lf_id || data.LF_Id || null;
            currentAccountId = data.account_id || data.Account_Id || null;
            console.log("Captured currentLfId:", currentLfId);
            console.log("Captured currentAccountId:", currentAccountId);

            console.log("Parsed data used to populate form:", data);

            setFieldOptions("license_type", data.license_type_options);
            setFieldOptions("license_activities", data.license_activity_options);
            populateForm(data);
        } catch (loadErr) {
            console.error("Could not load license data:", loadErr);
            hideLoader();
            showToast("Couldn't load existing license data. You can still fill in the form manually.", "error", 4000);
            return;
        }

        hideLoader();

    } catch (err) {
        console.error(err);
        hideLoader();
        showToast(`Hi ${triggeredByUser || 'User'}, there is an issue with the internal system.`, "error", 4000);
    }
}

/* ---------------------------------------------------------------
   Submit
--------------------------------------------------------------- */
async function handleAction(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const submitBtn = event.submitter;
    submitBtn.disabled = true;
    showLoader("Saving renewal...");

    try {
        const v = (k) => getValue(fieldByKey(k));
        const payload = {
            "record_id": currentRecordId,
            "lf_id": currentLfId,
            "account_id": currentAccountId,
            "triggered_by": triggeredByUser,
            "license": {
                "trade_license_name":      v("trade_license_name"),
                "license_registration_no": v("license_registration_no"),
                "license_type":            v("license_type"),
                "license_package":         v("license_package"),
                "license_activities":      multiSelectState["license_activities"],
                "license_issuance_date":   v("license_issuance_date"),
                "license_start_date":      v("license_start_date"),
                "license_expiry_date":     v("license_expiry_date"),
                "license_duration":        v("license_duration"),
                "multi_year_continuation": v("multi_year_continuation")
            },
            "address": {
                "street_address": v("street_address"),
                "city":          v("city"),
                "state":         v("state"),
                "country":       v("country"),
                "code":          v("code")
            }
        };

        console.log(`Executing '${UPDATE_FUNCTION}' with parameters (Payload):`, payload);

        const response = await ZOHO.CRM.FUNCTIONS.execute(UPDATE_FUNCTION, {
            "arguments": JSON.stringify(payload)
        });

        console.log(`'${UPDATE_FUNCTION}' raw response:`, JSON.stringify(response, null, 2));
        hideLoader();

        if (response && response.code === "success") {
            showToast("The renewal trade license details have been successfully updated.", "success", 4000, () => {
                ZOHO.CRM.UI.Popup.closeReload();
            });
        } else {
            throw new Error((response && response.code) || "Operation failed");
        }
    } catch (error) {
        console.error(error);
        hideLoader();
        submitBtn.disabled = false;
        showToast(`Hi ${triggeredByUser || 'User'}, save failed. Please check your inputs or try again.`, "error", 4000);
    }
}

document.getElementById("record-form").addEventListener("submit", handleAction);