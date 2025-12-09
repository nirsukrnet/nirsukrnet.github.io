
// db_conns_oneaudio.js
// Loads JSON data for the single-file audio player

let gv = new GlobalVars();
window.gv = gv;

function MainFunc() {
    init().then(() => {
        console.log("MainFunc() complete.");
    }).catch(error => {
        console.error("Error during MainFunc() initialization:", error);
    });
}

async function init() {
    try {
        await LoadData();
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

async function LoadData() {
    try {
        // Attempt to load the JSON file containing phrase data
        // Ensure this file exists in html/phrase_audio/
        const response = await fetch('phrase_audio/SW_Learn_Day_1-5_srt_phrase.json');
        
        if (!response.ok) {
            throw new Error(`Failed to load phrase data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Populate global variables
        // Handle different potential JSON structures
        if (Array.isArray(data)) {
             gv.sts.audio_phrases = data;
        } else if (data.segments) {
             // Map the 'segments' format to the expected 'audio_phrases' format
             gv.sts.audio_phrases = data.segments.map(seg => ({
                 ...seg,
                 // Map 'text' to 'text_sv' as the default display text if text_sv is missing
                 text_sv: seg.text_sv || seg.text || '',
                 // Ensure start/end are numbers
                 start: parseFloat(seg.start),
                 end: parseFloat(seg.end)
             }));
        } else if (data.audio_phrases) {
             gv.sts.audio_phrases = data.audio_phrases;
        } else {
             // Fallback: assume the object itself might be the list or handle as needed
             console.warn("Unknown JSON structure, defaulting to empty list", data);
             gv.sts.audio_phrases = [];
        }

        // Placeholder for lessons if needed
        gv.sts.lessons_audio_phrases = []; 

        // Trigger content loading in oneaudio_text.js
        if (typeof window.loadContentData === 'function') {
            loadContentData();
        }

        // Dispatch event for other components
        const detail = {
            lessons: gv.sts.lessons_audio_phrases,
            phrases: gv.sts.audio_phrases,
            selected_lesson_id: gv.sts.selected_lesson_id
        };
        window.dispatchEvent(new CustomEvent('oap:data-loaded', { detail }));

    } catch (e) {
        console.error("LoadData failed:", e);
        // Optional: Display error to user on the page
        const listEl = document.getElementById('list');
        if (listEl) {
            listEl.innerHTML = `<div style="color:red; padding:20px;">Error loading data: ${e.message}</div>`;
        }
    }
}

// Helper to simulate Firebase-like updates if needed (local only for now)
function Update_And_Save_Audio_Phrase_ItemByIndex(item_data, itemindex) {
    // In a static file scenario, we can't save back to the server easily.
    // We just update the local state.
    if (gv.sts.audio_phrases && gv.sts.audio_phrases[itemindex]) {
        gv.sts.audio_phrases[itemindex] = item_data;
        console.log("Local state updated for item", itemindex);
    }
}
