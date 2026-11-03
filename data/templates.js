/* Degree templates. A template only supplies the course list; nobody's grades live here.
   Add a template for your programme with a pull request (see CONTRIBUTING.md).
   Fields: level, code, name, credits, req (true = university requirement, lower pass mark),
   aliases (other codes the same course is printed under, e.g. the alternative elective or a renamed code). */
window.GPA_TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank: I will type my own courses',
    university: '',
    totalCredits: 146,
    curriculum: [],
    nonDegree: []
  },
  {
    id: 'cu-science-biotech-molbiochem',
    title: 'Cairo University, Faculty of Science: Biotechnology / Molecular Biochemistry (146 cr)',
    university: 'Cairo University, Faculty of Science',
    totalCredits: 146,
    nonDegree: ['U110', 'U111'],   // 0-hour requirements (Critical thinking, Entrepreneurship): printed on the record, never counted
    curriculum: [
      [1, 'BTC111', 'General Chemistry I', 4], [1, 'BTBio111', 'Cell Biology', 4], [1, 'BTM111', 'Differential Calculus', 3],
      [1, 'BTPhy111', 'Physics I', 4], [1, 'BTU101', 'Computer Science', 2, 1], [1, 'BTU102', 'English language', 2, 1],
      [2, 'BTC122', 'General Chemistry II', 4], [2, 'BTBio122', 'Biodiversity', 4], [2, 'BTM122', 'Integral Calculus', 3],
      [2, 'BTPhy122', 'Physics II', 4], [2, 'BTU103', 'Human Rights', 2, 1], [2, 'BTU108', 'Social Science elective', 2, 1, ['BTU104', 'BTU109']],
      [3, 'BTBio211', 'Genetics', 4], [3, 'BTC211', 'Organic Chemistry I', 4], [3, 'BTM211', 'Biostatistics', 3],
      [3, 'BTC212', 'Physical Chemistry I', 4], [3, 'BTC213', 'Inorganic Chemistry I', 4],
      [4, 'BTBio222', 'Molecular Biology', 5], [4, 'BTC224', 'Organic Chemistry II', 2], [4, 'BTC225', 'Physical Chemistry II', 4],
      [4, 'BTC226', 'Inorganic Chemistry II', 4], [4, 'BTC227', 'Chemistry of Biomolecules', 4],
      [5, 'BTC311', 'Analytical Chemistry', 4], [5, 'BTBiophy311', 'Biophysics', 3], [5, 'BT311', 'Biotechnology Laboratory', 2],
      [5, 'BTC312', 'Proteins, Nucleic Acids Chem. & Enzymes', 2], [5, 'BTBio311', 'Microbiology', 3], [5, 'BTBio312', 'Animal Physiology', 4],
      [6, 'BT322', 'Biotechnology Laboratory II', 2], [6, 'BTC323', 'Instrumental Analysis', 4], [6, 'BTC324', 'Metabolism', 3],
      [6, 'BTBio323', 'Microbial Biotechnology', 4], [6, 'BTBio324', 'Immunology', 3], [6, 'BTBio325', 'Developmental Biology', 3],
      [7, 'BTC411', 'Enzymology and Biotechnology', 2], [7, 'BTBio411', 'Genomics / Proteomics / Bioinformatics', 2],
      [7, 'BT411(1)', 'Research project I', 5], [7, 'BTBio412', 'Plant Biotechnology', 3], [7, 'BTBio413', 'Infectious & Parasitic Diseases', 3],
      [7, 'BT412', 'Elective (Evol. Genetics / Toxicity)', 2, 0, ['BT412(T)']],
      [8, 'BT411(2)', 'Research project II', 5], [8, 'BT423', 'Molecular Markers', 2], [8, 'BT424', 'Biosafety and Ethics', 2],
      [8, 'BT425', 'Biotechnological Products Design', 2], [8, 'BTBio425', 'Environmental Biotechnology', 3],
      [8, 'BT426(S)', 'Elective (Stem Cells / Cancer Biology)', 2]
    ].map(function (c) { return { level: c[0], code: c[1], name: c[2], credits: c[3], req: !!c[4], aliases: c[5] || [] }; })
  }
];
