let hpData = [];
let currentEdition = 'US'; // 'US' or 'UK'
let bookStartPages = {};   // Stores the first page_number for each source so clicking a title jumps straight to its section

// Seven books, switched between the US and UK editions.
const HP_EDITION_SLOTS = {
    US: [
        { value: "Sorcerer's Stone", label: "SORCERER'S STONE" },
        { value: "Chamber of Secrets", label: "CHAMBER OF SECRETS" },
        { value: "Prisoner of Azkaban", label: "PRISONER OF AZKABAN" },
        { value: "Goblet of Fire", label: "GOBLET OF FIRE" },
        { value: "Order of the Phoenix", label: "ORDER OF THE PHOENIX" },
        { value: "Half-Blood Prince", label: "HALF-BLOOD PRINCE" },
        { value: "Deathly Hallows", label: "DEATHLY HALLOWS" }
    ],
    UK: [
        { value: "Harry Potter and the Philosopher's Stone (UK)", label: "PHILOSOPHER'S STONE (UK)" },
        { value: "Harry Potter and the Chamber of Secrets (UK)", label: "CHAMBER OF SECRETS (UK)" },
        { value: "Harry Potter and the Prisoner of Azkaban (UK)", label: "PRISONER OF AZKABAN (UK)" },
        { value: "Harry Potter and the Goblet of Fire (UK)", label: "GOBLET OF FIRE (UK)" },
        { value: "Harry Potter and the Order of the Phoenix (UK)", label: "ORDER OF THE PHOENIX (UK)" },
        { value: "Harry Potter and the Half-Blood Prince (UK)", label: "HALF-BLOOD PRINCE (UK)" },
        { value: "Harry Potter and the Deathly Hallows (UK)", label: "DEATHLY HALLOWS (UK)" }
    ]
};

// The four sources available independently of the edition switch.
const EXTRA_SOURCES = [
    'Fantastic Beasts',
    'The Crimes of Grindelwald',
    'The Secrets of Dumbledore',
    'The Harry Potter Prequel'
];

// The original tweet categories are read from their restored checkboxes.
// This prevents any unrelated records from silently entering search results.
const TWEET_SOURCES = Array.from(
    document.querySelectorAll('[data-category="J.K. ROWLING TWEETS"] input[type="checkbox"]')
).map(input => input.value);

// Only these source IDs can enter the search data. Interviews and Original
// Writings remain excluded, but all original JKR tweet categories are retained.
const ALLOWED_SOURCES = new Set([
    ...HP_EDITION_SLOTS.US.map(slot => slot.value),
    ...HP_EDITION_SLOTS.UK.map(slot => slot.value),
    ...EXTRA_SOURCES,
    ...TWEET_SOURCES
]);

// Tweet archives use two equivalent category naming styles: some JSON exports
// omit the hyphen in 'Random Questions - ...'. Resolve both to the checkbox
// label, without changing the user's data or collapsing categories together.
function canonicalSourceKey(name) {
    return String(name || '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^Random Questions\s*-\s*/i, 'Random Questions ');
}
const SOURCE_NAME_LOOKUP = new Map(
    [...ALLOWED_SOURCES].map(name => [canonicalSourceKey(name), name])
);
function resolveSourceName(name) {
    return SOURCE_NAME_LOOKUP.get(canonicalSourceKey(name)) || null;
}
const TWEET_SOURCE_SET = new Set(TWEET_SOURCES);

// Search the two main databases and the tweet database; exclude interview databases.
const JSON_FILES = [
    'HP_Cleaned_Database.json',
    'HP_UK_Cleaned_Database.json',
    'JKR_Tweets.json'
];

// PDF filenames are unchanged for the retained materials.
const pdfFiles = {
    "Sorcerer's Stone": "harrypotter (1).pdf",
    "Chamber of Secrets": "harrypotter (1).pdf",
    "Prisoner of Azkaban": "harrypotter (1).pdf",
    "Goblet of Fire": "harrypotter (1).pdf",
    "Order of the Phoenix": "harrypotter (1).pdf",
    "Half-Blood Prince": "harrypotter (1).pdf",
    "Deathly Hallows": "harrypotter (1).pdf",

    "Harry Potter and the Philosopher's Stone (UK)": "PS UK.pdf",
    "Harry Potter and the Chamber of Secrets (UK)": "CoS UK.pdf",
    "Harry Potter and the Prisoner of Azkaban (UK)": "PoA UK.pdf",
    "Harry Potter and the Goblet of Fire (UK)": "GoF UK.pdf",
    "Harry Potter and the Order of the Phoenix (UK)": "OotP UK.pdf",
    "Harry Potter and the Half-Blood Prince (UK)": "HBP UK.pdf",
    "Harry Potter and the Deathly Hallows (UK)": "DH UK.pdf",

    "Fantastic Beasts": "Fantastic_Beasts_And_Where_To_Find_Them.pdf",
    "The Crimes of Grindelwald": "Fantastic-Beasts-The-Crimes-of-Grindelwald-the-Original-Screenplay-by-J.-K.-Rowling-z-lib.org_.pdf",
    "The Secrets of Dumbledore": "Fantastic_Beasts_The_Secrets_of_Dumbledore.pdf",
    "The Harry Potter Prequel": "The_Harry_Potter_Prequel.pdf",

    "Introduction": "JKR_Tweets.pdf",
    "#wizards4scotlandrugbyteam": "JKR_Tweets.pdf",
    "Random Questions - Houses, Voldemort, Dumbledore, and Patronuses": "JKR_Tweets.pdf",
    "Fantastic Anagrams": "JKR_Tweets.pdf",
    "Religion/belief/non-belief systems at Hogwarts": "JKR_Tweets.pdf",
    "Random Questions - Horcruxes, Fluffy, Grimmauld Place, Unauthorized Documentaries, Death, Dogs, Dumbledore, and Ghosts not named after politicians": "JKR_Tweets.pdf",
    "Wizarding Schools": "JKR_Tweets.pdf",
    "Cursed Child Announcement": "JKR_Tweets.pdf",
    "#NotAPrequel": "JKR_Tweets.pdf",
    "Random Questions - Aberforth, Credence, Birthdays, Hatstalls, Elvendork, Tuition, Teddy, Top Gear, Houses, Genetics, Government, TV adaptations, and Diagon Alley": "JKR_Tweets.pdf",
    "Fantastic Beasts plot, tea leaves, and Hurcruxes": "JKR_Tweets.pdf",
    "Scottish Rugby": "JKR_Tweets.pdf",
    "Random Questions - Cursed Child, Fan theories, Hagrid, Houses, and Catfights": "JKR_Tweets.pdf",
    "Random Questions - Crying, Divination, Magical Weddings, American Accents, Detentions, and whatev Row-Row": "JKR_Tweets.pdf",
    "Snape: Good, Evil or What?": "JKR_Tweets.pdf",
    "Random Questions - Puffskeins, Fantastic Beasts, Cursed Child, Black Hermione, Voldemort, Killing Hedwig, Wizarding Schools, Sorting, and Divination": "JKR_Tweets.pdf",
    "A History of Magic in North America": "JKR_Tweets.pdf",
    "Random Questions - Fantastic Beasts, Rejection Letters, Boggart quiz, Real Fantastic Beasts, Curses, Cursed Child tours, Battle of Hogwarts anniversary, Fawkes isn't a Hurcrux, and Expecto Patronum tattoos": "JKR_Tweets.pdf",
    "#KeepTheSecrets": "JKR_Tweets.pdf",
    "Random Questions - Brexit, Running for parliament, Ilvermorny sorting, Dumbledore trashing Hogwarts, Cursed Child opening, Voldemort, Gary, and flippant twitter bios": "JKR_Tweets.pdf",
    "Patronus Test launch": "JKR_Tweets.pdf",
    "Random Questions - Fallen Hippogrifs, houses, swapping Patronuses, giant spiders, and lovable monsters": "JKR_Tweets.pdf",
    "Five movies": "JKR_Tweets.pdf",
    "Fantastic Beast Premiere": "JKR_Tweets.pdf",
    "Fantastic Beasts Release": "JKR_Tweets.pdf",
    "Random Questions - Mooncalfs, New books, Newt's travelling methods, canon, sequels, fanart, shiping, Ilvermorny houses, and Legimency": "JKR_Tweets.pdf"
};

// 1. Fetch all JSON databases
function loadAllDatabases() {
    Promise.all(
        JSON_FILES.map(file =>
            fetch(file + '?t=' + Date.now())
                .then(res => res.ok ? res.json() : [])
                .catch(() => [])
        )
    )
        .then(arrays => {
            const combined = arrays.flat().filter(item =>
                item && typeof item.book === 'string' &&
                resolveSourceName(item.book) !== null
            );

            const seen = new Set();
            const unique = [];
            bookStartPages = {};

            for (const item of combined) {
                const b = resolveSourceName(item.book);
                const c = (item.chapter || "").replace(/\s+/g, " ").trim();
                // Keep line breaks inside an exchange. Each JSON object stays
                // ONE search record, but its individual tweets stay separate.
                const t = String(item.text_content || "")
                    .replace(/\r\n?/g, "\n")
                    .replace(/[^\S\n]+/g, " ")
                    .replace(/ *\n */g, "\n")
                    .trim();
                const key = `${b}|${item.page_number}|${item.paragraph_id}|${t.slice(0, 40)}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push({ ...item, book: b, chapter: c, text_content: t });

                    // Record the earliest page_number for each source
                    const pageNum = Number(item.page_number);
                    if (Number.isInteger(pageNum) && pageNum > 0 &&
                        (bookStartPages[b] === undefined || pageNum < bookStartPages[b])) {
                        bookStartPages[b] = pageNum;
                    }
                }
            }

            hpData = unique;
            decorateSourceLabelsForPdfLinks();
            console.log(`Database loaded successfully! ${hpData.length} paragraphs ready to search.`);
        })
        .catch(error => console.error("Error loading databases:", error));
}

// Adds a subtle hover/tooltip to source names that have a linked PDF
function decorateSourceLabelsForPdfLinks() {
    document.querySelectorAll('#source-checkboxes label').forEach(label => {
        const cb = label.querySelector('input[type="checkbox"]');
        if (!cb) return;
        const pdf = pdfFiles[cb.value];
        if (pdf) {
            label.title = `Click name to open ${pdf} (Click checkbox to toggle selection)`;
            label.style.cursor = 'pointer';
        } else {
            label.title = 'No PDF file linked yet';
        }
    });
}

loadAllDatabases();

// 2. Grab HTML elements
const searchBtn = document.getElementById('search-btn');
const mainSearch = document.getElementById('main-search');
const exactPhrase = document.getElementById('exact-phrase');
const withoutWord = document.getElementById('without-word');
const searchScope = document.getElementById('search-scope');
const exactWordToggle = document.getElementById('exact-word-toggle');
const resultsPanel = document.querySelector('.results-panel');
const searchMode = document.getElementById('search-mode');

// Checkbox & Edition Switch Elements
const selectBooksBtn = document.getElementById('select-books-btn');
const checkAllBtn = document.getElementById('check-all-btn');
const uncheckAllBtn = document.getElementById('uncheck-all-btn');
const editionUsBtn = document.getElementById('edition-us-btn');
const editionUkBtn = document.getElementById('edition-uk-btn');

// US / UK Edition Switcher Logic
function switchBookEdition(edition) {
    currentEdition = edition;
    const slots = HP_EDITION_SLOTS[edition];

    document.querySelectorAll('input[data-hp-slot]').forEach(input => {
        const slotIndex = parseInt(input.getAttribute('data-hp-slot'), 10);
        const slotData = slots[slotIndex];
        if (slotData) {
            input.value = slotData.value;
            const labelSpan = input.parentElement.querySelector('.hp-slot-label');
            if (labelSpan) labelSpan.textContent = slotData.label;
        }
    });

    decorateSourceLabelsForPdfLinks();

    if (editionUsBtn && editionUkBtn) {
        if (edition === 'US') {
            editionUsBtn.style.backgroundColor = 'var(--accent-color, #5c6653)';
            editionUsBtn.style.color = '#fff';
            editionUsBtn.style.fontWeight = 'bold';
            editionUsBtn.style.opacity = '1';

            editionUkBtn.style.backgroundColor = '';
            editionUkBtn.style.color = '';
            editionUkBtn.style.fontWeight = 'normal';
            editionUkBtn.style.opacity = '0.65';
        } else {
            editionUkBtn.style.backgroundColor = 'var(--accent-color, #5c6653)';
            editionUkBtn.style.color = '#fff';
            editionUkBtn.style.fontWeight = 'bold';
            editionUkBtn.style.opacity = '1';

            editionUsBtn.style.backgroundColor = '';
            editionUsBtn.style.color = '';
            editionUsBtn.style.fontWeight = 'normal';
            editionUsBtn.style.opacity = '0.65';
        }
    }
}

if (editionUsBtn && editionUkBtn) {
    editionUsBtn.addEventListener('click', () => switchBookEdition('US'));
    editionUkBtn.addEventListener('click', () => switchBookEdition('UK'));
}

// 3. Listeners
searchBtn.addEventListener('click', performSearch);
mainSearch.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') performSearch();
});

// Select only the seven book slots of the currently displayed (US or UK) edition.
// Fantastic Beasts, the prequel and JKR tweets are deselected.
selectBooksBtn.addEventListener('click', () => {
    document.querySelectorAll('#source-checkboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = cb.hasAttribute('data-hp-slot');
    });
});

checkAllBtn.addEventListener('click', () => {
    document.querySelectorAll('#source-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = true);
});
uncheckAllBtn.addEventListener('click', () => {
    document.querySelectorAll('#source-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
});

// Checkbox Drag-to-Toggle + Click-Source-Name-to-Open-PDF Logic
const sourceCheckboxesContainer = document.getElementById('source-checkboxes');
let isDraggingCheckboxes = false;
let dragTargetState = true;
let handledByDragMouse = false;

if (sourceCheckboxesContainer) {
    sourceCheckboxesContainer.style.userSelect = 'none';

    // 1. Mousedown on the CHECKBOX SQUARE starts drag-to-check / uncheck
    sourceCheckboxesContainer.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;

        // Only start checkbox toggling if the user clicked the actual checkbox input
        if (e.target.matches('input[type="checkbox"]')) {
            const checkbox = e.target;
            isDraggingCheckboxes = true;
            handledByDragMouse = true;
            dragTargetState = !checkbox.checked;
            checkbox.checked = dragTargetState;
            e.preventDefault();
        }
    });

    // 2. While dragging after clicking a checkbox, sweeping over rows toggles their checkboxes
    sourceCheckboxesContainer.addEventListener('mouseover', (e) => {
        if (!isDraggingCheckboxes) return;
        const label = e.target.closest('label');
        if (!label || !sourceCheckboxesContainer.contains(label)) return;

        const checkbox = label.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = dragTargetState;
        }
    });

    // 3. Click handler:
    //    - If clicking the checkbox square: prevent double-toggle from mousedown
    //    - If clicking the SOURCE NAME text: prevent checkbox toggle and open the PDF!
    sourceCheckboxesContainer.addEventListener('click', (e) => {
        const label = e.target.closest('label');
        if (!label || !sourceCheckboxesContainer.contains(label)) return;

        if (e.target.matches('input[type="checkbox"]')) {
            if (handledByDragMouse) {
                e.preventDefault();
                handledByDragMouse = false;
            }
            return;
        }

        // User clicked on the source text/name, NOT the checkbox square
        e.preventDefault(); // Stop <label> from toggling the checkbox

        const checkbox = label.querySelector('input[type="checkbox"]');
        if (!checkbox) return;

        const bookName = checkbox.value;
        const fileName = pdfFiles[bookName];

        if (fileName) {
            const startPage = bookStartPages[bookName] || 1;
            const pdfUrl = `${fileName}#page=${startPage}`;
            window.open(pdfUrl, '_blank');
        } else {
            alert(`No PDF is currently linked for "${bookName}".`);
        }
    });

    window.addEventListener('mouseup', () => {
        isDraggingCheckboxes = false;
        setTimeout(() => { handledByDragMouse = false; }, 0);
    });
}

// Helper Function: Escapes special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper Function: Cleans up PDF formatting quirks for search matching
function normalizeText(str) {
    if (!str) return "";
    return str
        .replace(/[\u2018\u2019`]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/-\s+/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Escape source content before inserting it into result cards. Apart from being
// safer, this ensures punctuation in quotes/tweets is displayed literally.
function escapeResultText(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Highlight without damaging HTML entities or creating nested <mark> tags.
function applyHighlighting(text, query, exact, isExactMatch) {
    const terms = [
        ...(query ? query.split(/\s+/) : []),
        ...(exact ? [exact] : [])
    ].filter(Boolean);
    if (!terms.length) return escapeResultText(text);

    // Prefer the longer expression when both a phrase and a word overlap.
    const unique = [...new Set(terms)].sort((a, b) => b.length - a.length);
    const alternatives = unique.map(escapeRegExp).join('|');
    const boundary = isExactMatch ? '\\b' : '';
    const matcher = new RegExp(boundary + '(' + alternatives + ')' + boundary, 'gi');
    let output = '';
    let previous = 0;
    for (const match of String(text).matchAll(matcher)) {
        output += escapeResultText(text.slice(previous, match.index));
        output += '<mark>' + escapeResultText(match[0]) + '</mark>';
        previous = match.index + match[0].length;
    }
    return output + escapeResultText(text.slice(previous));
}

// Search operates on one JSON record per tweet exchange, but rendering breaks
// each message into its own paragraph INSIDE the same result card.
function renderResultText(startIndex, endIndex, query, exact, isExactMatch) {
    const rendered = [];
    for (let k = startIndex; k <= endIndex; k++) {
        const record = hpData[k];
        const isTweet = TWEET_SOURCE_SET.has(record.book);
        const lines = String(record.text_content || '').split(/\n+/).filter(line => line.trim());
        const paragraphs = lines.map(line =>
            '<p class="archive-message">' +
            applyHighlighting(line, query, exact, isExactMatch) +
            '</p>'
        ).join('');
        rendered.push(
            '<div class="archive-record' + (isTweet ? ' archive-tweet-exchange' : '') + '">' +
            paragraphs +
            '</div>'
        );
    }
    return rendered.join('');
}

// 4. Core Search Logic
function performSearch() {
    const query = normalizeText(mainSearch.value.toLowerCase());
    const exact = normalizeText(exactPhrase.value.toLowerCase());
    const without = normalizeText(withoutWord.value.toLowerCase());
    const scope = parseInt(searchScope.value);
    const isExactMatch = exactWordToggle.checked;
    const mode = searchMode.value;
    const selectedSources = Array.from(document.querySelectorAll('#source-checkboxes input[type="checkbox"]:checked')).map(cb => cb.value).filter(source => ALLOWED_SOURCES.has(source));

    resultsPanel.innerHTML = '<p style="padding: 20px;">Searching archive...</p>';

    if (!query && !exact) {
        resultsPanel.innerHTML = '<p style="padding: 20px;">Please enter a search term or exact phrase.</p>';
        return;
    }

    if (selectedSources.length === 0) {
        resultsPanel.innerHTML = '<p style="padding: 20px;">Please select at least one source material to search.</p>';
        return;
    }

    const results = [];

    for (let i = 0; i < hpData.length; i++) {
        let isSourceMatch = selectedSources.includes(hpData[i].book);
        if (!isSourceMatch) continue;

        let combinedText = hpData[i].text_content;
        let j = i + 1;
        let paragraphsAdded = 1;

        while (paragraphsAdded < scope && j < hpData.length && hpData[j].book === hpData[i].book) {
            combinedText += " \n " + hpData[j].text_content;
            j++;
            paragraphsAdded++;
        }

        const textToSearch = normalizeText(combinedText.toLowerCase());
        let match = true;

        if (query) {
            const words = query.split(/\s+/);

            if (mode === 'and') {
                for (let word of words) {
                    if (isExactMatch) {
                        const rx = new RegExp('\\b' + escapeRegExp(word) + '\\b', 'i');
                        if (!rx.test(textToSearch)) { match = false; break; }
                    } else {
                        if (!textToSearch.includes(word)) { match = false; break; }
                    }
                }
            } else if (mode === 'or') {
                let anyMatch = false;
                for (let word of words) {
                    if (isExactMatch) {
                        const rx = new RegExp('\\b' + escapeRegExp(word) + '\\b', 'i');
                        if (rx.test(textToSearch)) { anyMatch = true; break; }
                    } else {
                        if (textToSearch.includes(word)) { anyMatch = true; break; }
                    }
                }
                if (!anyMatch) match = false;
            }
        }

        if (match && exact) {
            if (isExactMatch) {
                const rx = new RegExp('\\b' + escapeRegExp(exact) + '\\b', 'i');
                if (!rx.test(textToSearch)) match = false;
            } else {
                if (!textToSearch.includes(exact)) match = false;
            }
        }

        if (match && without) {
            if (isExactMatch) {
                const rx = new RegExp('\\b' + escapeRegExp(without) + '\\b', 'i');
                if (rx.test(textToSearch)) match = false;
            } else {
                if (textToSearch.includes(without)) match = false;
            }
        }

        if (match) {
            results.push({
                book: hpData[i].book,
                chapter: hpData[i].chapter,
                page_number: hpData[i].page_number,
                startIndex: i,
                endIndex: j - 1
            });
            i += (paragraphsAdded - 1);
        }
    }

    displayResults(results, query, exact, isExactMatch);
}

// 5. Display the Results
function displayResults(results, query, exact, isExactMatch) {
    resultsPanel.innerHTML = '';

    if (results.length === 0) {
        resultsPanel.innerHTML = '<p style="padding: 20px;">No matching records found in the selected sources.</p>';
        return;
    }

    let matchCounts = {};

    if (query) {
        const words = query.split(/\s+/);
        words.forEach(word => {
            if (word) matchCounts[word] = 0;
        });
    }

    if (exact) {
        matchCounts[exact] = 0;
    }

    results.forEach(result => {
        let blockText = '';
        for (let k = result.startIndex; k <= result.endIndex; k++) {
            blockText += hpData[k].text_content + " ";
        }

        let normalizedBlock = normalizeText(blockText);

        for (let term in matchCounts) {
            const bound = isExactMatch ? '\\b' : '';
            const rx = new RegExp(bound + escapeRegExp(term) + bound, 'gi');
            const matches = normalizedBlock.match(rx);
            if (matches) {
                matchCounts[term] += matches.length;
            }
        }
    });

    let breakdownHTML = Object.keys(matchCounts)
        .map(term => `<span style="color: var(--text-main);">"${term}"</span>: ${matchCounts[term]}`)
        .join(' &nbsp;|&nbsp; ');

    const countMessage = document.createElement('p');
    countMessage.style.padding = '0 20px 20px 20px';
    countMessage.style.color = 'var(--text-muted)';
    countMessage.innerHTML = `Found <strong>${results.length} clusters</strong>.<br><span style="font-size: 0.9em; margin-top: 5px; display: inline-block;">Hits: &nbsp; ${breakdownHTML}</span>`;
    resultsPanel.appendChild(countMessage);

    results.forEach((result, index) => {
        const highlightedHTML = renderResultText(
            result.startIndex, result.endIndex, query, exact, isExactMatch
        );

        const card = document.createElement('div');
        card.className = 'result-card';

        const fileName = pdfFiles[result.book];
        let pdfButtonHTML = '';

        if (fileName) {
            let searchTerm = '';
            if (exact) {
                searchTerm = exact;
            } else if (query) {
                searchTerm = query.split(/\s+/)[0];
            }

            const validPage = Number(result.page_number);
            const pageNum = Number.isInteger(validPage) && validPage > 0 ? validPage : 1;
            const pdfUrl = `${fileName}#page=${pageNum}&search=${encodeURIComponent(searchTerm)}`;

            pdfButtonHTML = `<a href="${pdfUrl}" target="_blank" class="action-btn" style="text-decoration: none; display: inline-block; background-color: var(--accent-color); color: #fff; margin-left: 10px; padding: 5px 10px;">Open in PDF</a>`;
        }

        card.innerHTML = `
            <div class="result-meta">
                <span class="book-title">${result.book}</span> | 
                <span class="chapter-title">${result.chapter}</span> | 
                <span class="page-num">Page ${result.page_number}</span>
            </div>
            <div class="result-text" id="text-block-${index}">
                ${highlightedHTML}
            </div>
            <div class="result-actions">
                <button class="action-btn expand-back-btn" data-block-id="${index}" data-start="${result.startIndex}" data-end="${result.endIndex}">Expand Backward</button>
                <button class="action-btn expand-fwd-btn" data-block-id="${index}" data-start="${result.startIndex}" data-end="${result.endIndex}">Expand Forward</button>
                ${pdfButtonHTML}
            </div>
        `;
        resultsPanel.appendChild(card);
    });

    document.querySelectorAll('.expand-back-btn').forEach(btn => {
        btn.addEventListener('click', function () { expandDynamic(this, 'backward', query, exact, isExactMatch); });
    });
    document.querySelectorAll('.expand-fwd-btn').forEach(btn => {
        btn.addEventListener('click', function () { expandDynamic(this, 'forward', query, exact, isExactMatch); });
    });
}

// 6. Dynamic Infinite "Expand Quote" with Highlight Retention
function expandDynamic(button, direction, query, exact, isExactMatch) {
    const blockId = button.getAttribute('data-block-id');
    const backBtn = button.parentNode.querySelector('.expand-back-btn');
    const fwdBtn = button.parentNode.querySelector('.expand-fwd-btn');

    let startIndex = parseInt(backBtn.getAttribute('data-start'));
    let endIndex = parseInt(fwdBtn.getAttribute('data-end'));

    if (direction === 'backward' && startIndex > 0) {
        if (hpData[startIndex - 1].book === hpData[startIndex].book) {
            startIndex -= 1;
        }
    } else if (direction === 'forward' && endIndex < hpData.length - 1) {
        if (hpData[endIndex + 1].book === hpData[endIndex].book) {
            endIndex += 1;
        }
    }

    backBtn.setAttribute('data-start', startIndex);
    fwdBtn.setAttribute('data-end', endIndex);

    const textContainer = document.getElementById(`text-block-${blockId}`);
    textContainer.innerHTML = renderResultText(
        startIndex, endIndex, query, exact, isExactMatch
    );
}

// 7. Dynamic Highlight Styling Controls
const markBold = document.getElementById('mark-bold');
const markItalic = document.getElementById('mark-italic');
const markColor = document.getElementById('mark-color');
const markOpacity = document.getElementById('mark-opacity');

function updateHighlightStyle() {
    const root = document.documentElement;
    root.style.setProperty('--mark-weight', markBold.checked ? 'bold' : 'normal');
    root.style.setProperty('--mark-style', markItalic.checked ? 'italic' : 'normal');

    const hex = markColor.value;
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const opacity = markOpacity.value;

    root.style.setProperty('--mark-bg', `rgba(${r}, ${g}, ${b}, ${opacity})`);

    if (parseFloat(opacity) > 0.4) {
        root.style.setProperty('--mark-text-color', '#fff');
    } else {
        root.style.setProperty('--mark-text-color', 'inherit');
    }
}

[markBold, markItalic, markColor, markOpacity].forEach(input => {
    input.addEventListener('input', updateHighlightStyle);
});
updateHighlightStyle();
