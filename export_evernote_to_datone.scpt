(*
* @Author: vicent
* @Date:   2017-08-15 17:34:16
* @Last Modified by:   vicent
* @Last Modified time: 2017-08-15 17:34:20
*)

-- IF YOU'D LIKE THE SCRIPT TO NOT CREATE A
-- "HEADER LINE" FOR THE DAY ONE ENTRY USING
-- THE TITLE OF THE EVERNOTE ITEM, THEN
-- CHANGE THIS VALUE TO "false"…
property dayHeader : true

-- INSTALL PANDOC TO CONVERT TO MARKDOWN? (INSTALL PANDOC WITH HOMEBREW)
property convertMarkdown : false

(*
======================================
// OTHER PROPERTIES (USE CAUTION WHEN CHANGING)
======================================
*)

property noteName : ""
property noteCreated : ""
property noteHTML : ""
property noteLink : ""
property note_Date : ""
property noteTags : {}
property noteNotebook : ""

(*
======================================
// MAIN PROGRAM
======================================
*)

tell application "Evernote"
    set selected_Items to selection
    repeat with selected_Item in selected_Items
        --GET THE EVERNOTE DATA
        my getEvernote_Info(selected_Item)

        --CONVERT HTML TO PLAIN TEXT
        if convertMarkdown is true then
            set note_Text to my convert_Markdown(noteHTML)
        else
            set note_Text to my convert_Plaintext(noteHTML)
        end if

        --CONVERT DATE TO PLAIN TEXT STRING
        set note_Date to my convert_Date(noteCreated)

        --ADD TAGS
        set note_Text to my add_Tags(note_Text, noteTags, noteNotebook)


        --MAKE THE NEW ITEM IN DAY ONE
        my make_DayOne(noteName, note_Date, note_Text, noteLink, noteTags)

    end repeat
end tell

(*
======================================
// PREPARATORY SUBROUTINES
======================================
*)
--GET THE EVERNOTE DATA
on getEvernote_Info(theNotes)
    tell application "Evernote"
        try
            set noteID to (local id of item 1 of theNotes)
            set noteName to (title of item 1 of theNotes)
            set noteSource to (source URL of item 1 of theNotes)
            set noteCreated to (creation date of item 1 of theNotes)
            set noteModified to (modification date of item 1 of theNotes)
            set noteTags to (tags of item 1 of theNotes)
            set noteAttachments to {attachments of item 1 of theNotes}
            set noteAltitude to (altitude of item 1 of theNotes)
            set noteENML to (ENML content of item 1 of theNotes)
            set noteHTML to (HTML content of item 1 of theNotes)
            set noteLat to (latitude of item 1 of theNotes)
            set noteLong to (longitude of item 1 of theNotes)
            set noteNotebook to (name of notebook of item 1 of theNotes)
            set noteLink to (note link of item 1 of theNotes)
        end try
    end tell
end getEvernote_Info

(*
======================================
// UTILITY SUBROUTINES
======================================
*)

--CONVERT HTML TO PLAIN TEXT
on convert_Plaintext(noteHTML)
    set shell_Text to "echo " & (quoted form of noteHTML) & " | textutil -stdin -convert txt -stdout"
    set note_Text to do shell script shell_Text
    return note_Text
end convert_Plaintext

--CONVERT HTML TO MARKDOWN
on convert_Markdown(noteHTML)
    set shell_Text to "echo " & (quoted form of noteHTML) & " | /usr/local/bin/pandoc -s -f html -t markdown_github"
    set note_Text to do shell script shell_Text
    return note_Text
end convert_Markdown

--CONVERT DATE TO PLAIN TEXT STRING
on convert_Date(noteCreated)
    set AppleScript's text item delimiters to ""
    set m to ((month of noteCreated) * 1)
    set d to (day of noteCreated)
    set y to (year of noteCreated)
    set t to (time string of noteCreated)
    set date_String to (m & "/" & d & "/" & y & " " & t) as string
    return date_String
end convert_Date

--ADD TAGS TO NOTE TEXT
on add_Tags(note_Text, noteTags, noteNotebook)
    set noteTagsText to ""
    if noteTags is not {} then
        repeat with i from 1 to count of noteTags
            set noteTagsText to noteTagsText & "#" & (name of item i of noteTags) & " "
        end repeat
    end if
    if noteNotebook is not "" then set noteTagsText to "Notebook: #" & noteNotebook & "
" & noteTagsText

    return note_Text & "

" & noteTagsText
end add_Tags

--PARSE HTML
on parse_HTML(note_Text)
    return note_Text
end parse_HTML

(*
======================================
// MAIN HANDLER SUBROUTINES
======================================
*)

--MAKE ITEM IN DAY ONE
on make_DayOne(noteName, note_Date, note_Text, noteLink)
    if dayHeader is true then set note_Text to (noteName & return & return & note_Text)
    set new_DayOne to "echo " & (quoted form of note_Text) & " | '/usr/local/bin/dayone' -d=\"" & note_Date & "\" new"
    do shell script new_DayOne

end make_DayOne
