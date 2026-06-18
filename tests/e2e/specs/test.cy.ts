describe('My First Test', () => {
  it('Visits the app root url', () => {
    cy.visit('/auth')
    cy.contains('Bienvenido de nuevo')
  })
})
