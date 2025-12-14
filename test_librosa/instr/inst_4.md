# Instruction: Implement Dynamic Audio Selection Menu

## Goal
Create `librosa4.html` based on `librosa3.html`. Add a menu system that allows the user to switch between different audio files defined in a JSON configuration.

## 1. Data Source
Read the menu configuration from:
`json/menu_list.json`

Structure:
```json
{
  "menu_list": [
    {
      "id": 1,
      "name": "SW_Learn_Day_1-5",
      "path_mp3": "../phrase_audio/SW_Learn_Day_1-5.mp3",
      "path_json": "json/SW_Learn_Day_1-5_librosa.json"
    }
    // ... more items
  ]
}
```

## 2. UI Changes
*   Add a **"Menu"** button to the top of the page (e.g., near the title or controls).
*   Create a **Menu Container** (hidden by default) that will list the available audio tracks.
*   Style the menu as a modal or dropdown that overlays the content.

## 3. Functionality
1.  **Load Menu Data**: On page load, fetch `json/menu_list.json`.
2.  **Toggle Menu**: Clicking the "Menu" button should show/hide the menu container.
3.  **Render Items**: Dynamically generate buttons or list items for each entry in `menu_list`. Display the `name` property.
4.  **Selection**: When a user clicks an item in the menu:
    *   Call `loadSharedData(path_mp3, path_json)` with the selected item's paths.
    *   Hide the menu.
    *   (Optional) Update the page title or status to show the currently loaded file.

## Output
Apply these changes to `c:\Python\AuTr\html\test_librosa\librosa4.html`.