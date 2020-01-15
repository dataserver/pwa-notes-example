if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js');
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        new iqwerty.toast.Toast(event.data);
    });
}

const state = {
    online: null,
    notes: []
};

async function loadNotes() {
    const response = await fetch("/notes/");
    return await response.json();
}

function showNotes() {
    const eNotes = document.querySelector(".notes");
    while (eNotes.firstChild) {
        eNotes.removeChild(eNotes.firstChild);
    }
    let notesList = "";
    state.notes.forEach((note, idx) => {
        notesList += `<div class="note" data-idx="${idx}">${note.text}</div>`;
    });
    eNotes.innerHTML = `${notesList}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    state.notes = await loadNotes();
    showNotes();

    const eNotes = document.querySelector(".notes");
    eNotes.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("note")) {
            var idxToDelete = ev.target.dataset.idx;
            fetch("/notes/",
                {
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8'
                    },
                    method: "DELETE",
                    body: JSON.stringify({ idx: idxToDelete })
                }
            ).then(() => {
                state.notes.splice(idxToDelete, 1);
                showNotes();
                new iqwerty.toast.Toast("Note deleted!");
            }).catch(() => {
                new iqwerty.toast.Toast("Note not deleted offline. Deletion of notes is only possible when online.");
            });
        }
    });

    document.querySelector(".btn-refresh").addEventListener("click", async () => {
        state.notes = await loadNotes();
        showNotes();
    });

    document.querySelector(".btn-add-note").addEventListener("click", async () => {
        document.querySelector(".newNoteDialog").classList.remove("hidden");
    });

    document.querySelector(".btn-close-dialog").addEventListener("click", async () => {
        document.querySelector(".newNoteDialog").classList.add("hidden");
    });

    document.querySelector(".btn-save-note").addEventListener("click", async () => {
        document.querySelector(".newNoteDialog").classList.add("hidden");
        const eNoteText = document.querySelector("#noteText");
        const noteToSend = {
            date: luxon.DateTime.local(),
            text: eNoteText.value
        };
        eNoteText.value = "";

        state.notes.push(noteToSend);

        // this adds the note to the response cache to avoid lost data when the user refreshes the site offline
        caches.open('notes-cache').then((cache) => {
            cache.put("/notes/", new Response(JSON.stringify(state.notes)));
        });

        showNotes();
        fetch("/notes/",
            {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                method: "POST",
                body: JSON.stringify(noteToSend)
            }
        ).then(() => {
            new iqwerty.toast.Toast("Note saved!");
        }).catch(() => {
            console.warn("Could not send note to server. Anyway it is queued, and sent later.");
            new iqwerty.toast.Toast("Note saved offline. It is sent to the server, as soon as internet connection comes back.");
        });
    });

    function updateOnlineStatus(event) {
        state.online = navigator.onLine;
        updateConnectivityVisual();
    }

    function updateConnectivityVisual() {
        if (state.online) {
            document.querySelector(".offline-hint").classList.add("hidden");
            document.querySelector(".btn-refresh").classList.remove("hidden");
        } else {
            document.querySelector(".offline-hint").classList.remove("hidden");
            document.querySelector(".btn-refresh").classList.add("hidden");
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
});
