// Typeset CV — reads the same merged data the website uses.
// Compile: typst compile pdf/cv.typ public/cv.pdf --root .
#let data = json("/public/cv-data.json")
#let p = data.profile

// ---- Palette (mirrors the website) ----
#let accent = rgb("#7c2d36")
#let ink = rgb("#23201c")
#let soft = rgb("#4a463f")
#let faint = rgb("#7c766c")
#let line-col = rgb("#cfc9bc")
#let sans = "DejaVu Sans"

// ---- Page + base text ----
#set document(title: p.name + " — Curriculum Vitae", author: p.name)
#set page(
  paper: "us-letter",
  margin: (x: 1.85cm, top: 1.9cm, bottom: 1.5cm),
  numbering: "1",
  number-align: center,
  header: context {
    if counter(page).get().first() > 1 {
      set text(size: 8.5pt, fill: faint, font: sans)
      grid(
        columns: (1fr, auto),
        align: (left, right),
        emph(p.name), [Curriculum Vitae],
      )
      v(-0.55em)
      line(length: 100%, stroke: 0.4pt + line-col)
    }
  },
)
#set text(font: "Libertinus Serif", size: 10pt, fill: ink, lang: "en")
#set par(justify: false, leading: 0.52em, spacing: 0.6em)

// ---- Helpers ----
#let yrange(s, e) = if e == none { str(s) + [–] } else if s == e { str(s) } else { str(s) + [–] + str(e) }

#let field(d, key) = d.at(key, default: none)

// Section heading: sans small-caps in accent, over a rule.
#let section(title) = {
  v(0.9em, weak: true)
  block(breakable: false, sticky: true)[
    #text(font: sans, size: 8.5pt, weight: "bold", fill: accent, tracking: 0.14em)[#upper(title)]
    #v(-0.45em)
    #line(length: 100%, stroke: 0.7pt + accent)
  ]
  v(0.35em)
}

// Two-column row: faint year/label on the left, content on the right.
#let entry(left, right) = grid(
  columns: (2.55cm, 1fr),
  column-gutter: 0.7em,
  row-gutter: 0pt,
  { set text(font: sans, size: 8.5pt, fill: faint); left },
  right,
)

// Bold every occurrence of the author's own surname.
#let authors(s) = {
  let parts = s.split("Siemsen")
  for (i, part) in parts.enumerate() {
    part
    if i < parts.len() - 1 { text(weight: "bold")[Siemsen] }
  }
}

// One publication line.
#let pub(it) = {
  let vol = field(it, "volume")
  let iss = field(it, "issue")
  let coords = if vol != none { vol + if iss != none { "(" + iss + ")" } else { "" } } else { none }
  let venue-bits = ((field(it, "venue"), coords, field(it, "pages")).filter(x => x != none)).join(", ")
  block(below: 0.7em, {
    authors(it.authors)
    if field(it, "year") != none [ (#str(it.year)). ] else [. ]
    [*#it.title.* ]
    if venue-bits != none { emph(venue-bits) }
    if field(it, "note") != none [ #text(fill: accent, size: 8.5pt, font: sans)[ · #it.note]]
    if field(it, "citations") != none [ #text(fill: faint, size: 8.5pt, font: sans)[ · cited by #it.citations]]
  })
}

// =====================================================================
//  Masthead
// =====================================================================
#block(spacing: 0.4em)[
  #text(size: 23pt, weight: "medium")[#p.name]
  #h(0.4em)
  #text(size: 12pt, fill: faint)[#field(p, "credential")]
]
#block(spacing: 0.3em, text(size: 10.5pt, fill: soft)[#p.title])
#block(text(size: 9.5pt, fill: faint)[#p.affiliation · #p.location])

#{
  let parts = ()
  if field(p, "email") not in (none, "") { parts.push(link("mailto:" + p.email)[#p.email]) }
  for l in p.links { parts.push(link(l.url)[#l.label]) }
  set text(size: 9pt, font: sans, fill: accent)
  block(above: 0.45em, parts.join(text(fill: line-col)[ · ]))
}

#v(0.1em)
#line(length: 100%, stroke: 0.7pt + ink)

// =====================================================================
//  Appointments
// =====================================================================
#section("Positions Held")
#for it in data.positions {
  entry(
    yrange(it.start, it.end),
    {
      text(weight: "bold")[#it.title]
      linebreak()
      text(fill: soft)[#it.org#if field(it, "unit") != none [, #it.unit]]
      if field(it, "location") != none { text(fill: faint)[ · #it.location] }
      v(0.45em)
    },
  )
}

// =====================================================================
//  Education
// =====================================================================
#section("Education")
#for it in data.education {
  entry(
    str(it.date),
    {
      text(weight: "bold")[#it.degree]
      linebreak()
      text(fill: soft)[#it.institution]
      if field(it, "thesis_title") != none [ \ #emph["#it.thesis_title"]]
      if field(it, "advisors") != none {
        for a in it.advisors [ \ #text(fill: faint, size: 9pt)[#a]]
      }
      v(0.5em)
    },
  )
}

// =====================================================================
//  Publications
// =====================================================================
#section("Research Publications")
#for it in data.publications.filter(x => x.category == "journal") { pub(it) }

#section("Books, Chapters & Other Publications")
#for it in data.publications.filter(x => x.category == "other") { pub(it) }

#section("Working Papers")
#for it in data.publications.filter(x => x.category == "working") {
  let target = field(it, "url")
  if target == none and field(it, "doi") != none { target = "https://doi.org/" + it.doi }
  block(below: 0.65em, {
    if target != none { link(target)[*#it.title.*] } else [*#it.title.*]
    [ ]
    authors(it.authors)
    if field(it, "note") != none [ #text(fill: accent, size: 8.5pt, font: sans)[ · #it.note]]
  })
}

// =====================================================================
//  Awards
// =====================================================================
#section("Awards, Fellowships & Grants")
#for it in data.awards {
  entry(
    it.date,
    {
      it.title
      if field(it, "detail") != none { text(fill: faint)[ — #it.detail] }
      v(0.3em)
    },
  )
}

// =====================================================================
//  Editorial work
// =====================================================================
#section("Editorial Work")
#for j in data.editorial {
  block(below: 0.55em, {
    text(weight: "bold")[#j.journal]
    for r in j.roles {
      linebreak()
      box(width: 1em)[]
      text(fill: soft)[#r.role]
      h(1fr)
      text(font: sans, size: 8.5pt, fill: faint)[#r.years]
    }
  })
}
#if field(data, "ad_hoc_reviewing") != none {
  block(above: 0.5em, text(size: 9pt, fill: faint)[#data.ad_hoc_reviewing])
}

// =====================================================================
//  Service
// =====================================================================
#section("Leadership in Professional Societies")
#for s in data.society_leadership {
  block(below: 0.45em, {
    text(weight: "bold")[#s.org]
    linebreak()
    text(fill: soft, size: 9.5pt)[#s.roles.join(" · ")]
  })
}

#section("Participation on Prize Committees")
#for c in data.prize_committees {
  block(below: 0.3em, text(size: 9.5pt)[• #c])
}

// =====================================================================
//  Doctoral students
// =====================================================================
#section("Doctoral Students")
#for s in data.doctoral_students {
  block(below: 0.5em, {
    text(weight: "bold")[#s.name]
    text(fill: faint, font: sans, size: 8.5pt)[ · PhD #s.year]
    linebreak()
    text(fill: soft, size: 9.5pt)[#s.role, #s.institution#if field(s, "placement") != none [. #s.placement]]
  })
}

// =====================================================================
//  Invited talks
// =====================================================================
#section("Invited Presentations")
#for t in data.invited_talks {
  block(below: 0.55em, {
    emph["#t.title"]
    linebreak()
    text(fill: faint, size: 9pt)[#t.venues]
  })
}

// =====================================================================
//  Teaching
// =====================================================================
#section("Teaching")
#table(
  columns: (auto, 1fr, auto, auto),
  inset: (x: 6pt, y: 3pt),
  stroke: none,
  align: (left, left, left, right),
  table.header(
    ..([Term], [Course], [Role], [Rating]).map(h =>
      text(font: sans, size: 8pt, weight: "bold", fill: faint)[#upper(h)])
  ),
  table.hline(stroke: 0.5pt + line-col),
  ..data.teaching.map(r => (
    text(font: sans, size: 8.5pt, fill: faint)[#r.semester],
    text(size: 9pt)[#r.course],
    text(size: 9pt, fill: soft)[#r.role],
    text(font: sans, size: 8.5pt, fill: soft)[#r.rating],
  )).flatten()
)
#if field(data, "teaching_note") != none {
  block(above: 0.5em, text(size: 9pt, fill: faint, style: "italic")[#data.teaching_note])
}

// =====================================================================
//  Software & sites
// =====================================================================
#section("Software & Websites")
#grid(
  columns: (1fr, 1fr),
  column-gutter: 1.2em,
  {
    text(font: sans, size: 8pt, weight: "bold", fill: faint)[GITHUB REPOSITORIES]
    for r in data.repositories {
      block(above: 0.35em, below: 0.35em, {
        link(r.url)[#text(weight: "bold", size: 9.5pt)[#r.url.replace("https://github.com/", "")]]
        linebreak()
        text(fill: faint, size: 9pt)[#r.description]
      })
    }
  },
  {
    text(font: sans, size: 8pt, weight: "bold", fill: faint)[WEBSITES]
    for w in data.websites {
      block(above: 0.35em, below: 0.35em, {
        link(w.url)[#text(weight: "bold", size: 9.5pt)[#w.url.replace("https://", "").trim("/")]]
        linebreak()
        text(fill: faint, size: 9pt)[#w.description]
      })
    }
  },
)

// =====================================================================
//  Administration
// =====================================================================
#section("Major Administrative Initiatives")
#for a in data.admin_initiatives {
  entry(a.years, block(below: 0.5em, text(fill: soft)[#a.description]))
}
