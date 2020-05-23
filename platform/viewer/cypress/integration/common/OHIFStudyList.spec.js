//We are keeping the hardcoded results values for the study list tests
//this is intended to be running in a controled docker environment with test data.
describe('OHIF Study List', function() {
  context('Desktop resolution', function() {
    before(function() {
      cy.openStudyList();
    });

    beforeEach(function() {
      cy.viewport(1750, 720);
      cy.initStudyListAliasesOnDesktop();
      //Clear all text fields
      cy.get('@PatientName').clear();
      cy.get('@MRN').clear();
      cy.get('@AccessionNumber').clear();
      cy.get('@StudyDescription').clear();
      cy.get('@modalities').clear();
    });

    it('searches Patient Name with exact string', function() {
      cy.get('@PatientName').type('Juno');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(3);
        expect($list).to.contain('Juno');
      });
    });

    it('searches MRN with exact string', function() {
      cy.get('@MRN').type('ProstateX-0000');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(2);
        expect($list).to.contain('ProstateX-0000');
      });
    });

    it('searches Accession with exact string', function() {
      cy.get('@AccessionNumber').type('fpcben98890');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(1);
        expect($list).to.contain('fpcben98890');
      });
    });

    it('searches Modality with camel case', function() {
      cy.get('@modalities').type('Mr');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(15); // TODO: Where are you hiding MISTER^MR?
        expect($list).to.contain('MR');
      });
    });

    it('searches Description with exact string', function() {
      cy.get('@StudyDescription').type('CHEST');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(2);
        expect($list).to.contain('CHEST');
      });
    });

    it('changes Rows per page and checks the study count', function() {
      //Show Rows per page options
      const pageRows = [25, 50, 100];

      //Check all options of Rows
      pageRows.forEach(numRows => {
        cy.get('select').select(numRows.toString()); //Select Rows per page option
        //Wait result list to be displayed
        cy.waitStudyList().then(() => {
          //Compare the search result with the Study Count on the table header
          cy.get('@studyCount')
            .should($studyCount => {
              expect(parseInt($studyCount.text())).to.be.at.most(numRows); //less than or equals to
            })
            .then($studyCount => {
              //Compare to the number of Rows in the search result
              cy.get('@searchResult').then($searchResult => {
                let countResults = $searchResult.length;
                expect($studyCount.text()).to.be.eq(countResults.toString());
              });
            });
        });
      });
    });

    //TO-TO: This test should be uncommented once issue #1120 is fixed:
    //https://github.com/OHIF/Viewers/issues/1120
    // it('filter study list by Study Date', function() {
    //   //Type Start and End dates
    //   cy.get('@studyListStartDate').type('01/01/2000');
    //   cy.get('@studyListEndDate').type('01/01/2019');
    //   //Display all results into one page
    //   cy.get('select').select('100');
    //   //Checks if all expected results are displayed
    //   //Wait result list to be displayed
    //   cy.waitStudyList();
    //   cy.get('@searchResult').should($list => {
    //     expect($list.length).to.be.eq(42);
    //   });
    // });
  });

  context('Tablet resolution', function() {
    before(function() {
      cy.openStudyList();
    });

    beforeEach(function() {
      cy.viewport(1000, 660);
      cy.initStudyListAliasesOnTablet();
      //Clear all text fields
      cy.get('@patientNameOrMRN').clear();
      cy.get('@accessionModalityDescription').clear();
    });

    it('searches Patient Name with exact string', function() {
      cy.get('@patientNameOrMRN').type('Juno');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(3);
        expect($list).to.contain('Juno');
      });
    });

    it('searches MRN with with exact string', function() {
      cy.get('@patientNameOrMRN').type('ProstateX-0000');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(6);
        expect($list).to.contain('ProstateX-0000');
      });
    });

    it('searches Modality with exact string', function() {
      cy.get('@accessionModalityDescription').type('MR');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(15); // TODO: Where are you hiding MISTER^MR?
        expect($list).to.contain('MR');
      });
    });

    it('searches Accession with exact string', function() {
      cy.get('@accessionModalityDescription').type('fpcben98890');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(1);
        expect($list).to.contain('fpcben98890');
      });
    });

    it('searches Description with exact string', function() {
      cy.get('@accessionModalityDescription').type('CHEST');
      //Wait result list to be displayed
      cy.waitStudyList();
      cy.get('@searchResult').should($list => {
        expect($list.length).to.be.eq(2);
        expect($list).to.contain('CHEST');
      });
    });

    it('changes Rows per page and checks the study count', function() {
      //Show Rows per page options
      const pageRows = [25, 50, 100];

      //Check all options of Rows
      pageRows.forEach(numRows => {
        cy.get('select').select(numRows.toString()); //Select Rows per page option
        //Wait result list to be displayed
        cy.waitStudyList().then(() => {
          //Compare the search result with the Study Count on the table header
          cy.get('@studyCount')
            .should($studyCount => {
              expect(parseInt($studyCount.text())).to.be.at.most(numRows); //less than or equals to
            })
            .then($studyCount => {
              //Compare to the number of Rows in the search result
              cy.get('@searchResult').then($searchResult => {
                let countResults = $searchResult.length;
                expect($studyCount.text()).to.be.eq(countResults.toString());
              });
            });
        });
      });
    });

    //TO-TO: This test should be uncommented once issue #1120 is fixed:
    //https://github.com/OHIF/Viewers/issues/1120
    // it('filter study list by Study Date', function() {
    //   //Type Start and End dates
    //   cy.get('@studyListStartDate').type('01/01/2000');
    //   cy.get('@studyListEndDate').type('01/01/2019');
    //   //Display all results into one page
    //   cy.get('select').select('100');
    //   //Checks if all expected results are displayed
    //   //Wait result list to be displayed
    //   cy.waitStudyList();
    //   cy.get('@searchResult').should($list => {
    //     expect($list.length).to.be.eq(42);
    //   });
    // });
  });
});
