lets consider this instr

C:\Python\AuTr\AudioTranscr\instr\inst_4.md

and this implementation

C:\Python\AuTr\AudioTranscr\db_scripts\fb_load_data.py

then you need to understand translation need to store only only in

      "text_en": "",

  "parttxt_1": {
    "txt1": {
      "text_sv": "Lyssna och säg efter.",
      "text_en": "",
      "text_uk": ""
    },


this type of storage is error/issue:

{
  "txt1": {
    "0": {
      "datetimetrans": "2025-12-27T22:10:36.545Z",
      "text_en": "Listen and repeat.",
      "text_sv": "Lyssna och säg efter.",
      "text_uk": ""
    },
    "text_en": "",
    "text_sv": "Lyssna och säg efter.",
    "text_uk": ""
  },
  "txt10": {
    "0": {
      "datetimetrans": "2025-12-27T22:10:36.550Z",
      "text_en": "see you",
      "text_sv": "syns",
      "text_uk": ""
    },
    "text_en": "",
    "text_sv": "syns",
    "text_uk": ""
  },


right way is:


{
  "txt1": {
    "text_en": "Listen and repeat.",
    "text_sv": "Lyssna och säg efter.",
    "text_uk": ""
  },
  "txt10": {
    "text_en": "see you",
    "text_sv": "syns",
    "text_uk": ""
  },

