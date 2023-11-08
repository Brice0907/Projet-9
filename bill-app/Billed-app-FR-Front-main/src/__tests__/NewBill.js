/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";
import store from "../__mocks__/store.js";
import BillsUI from "../views/BillsUI.js"
import mockStore from "../__mocks__/store"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Test unitaire sur l'icon mail
    test("Alors l'icon lettre est en surbrillance", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId('icon-mail'));
      const windowIcon = screen.getByTestId('icon-mail');

      // On vérifie si la class c'est bien 'active-icon'
      expect(windowIcon.className).toEqual('active-icon');
    })
    describe('Quand je séléctionne un fichier', () => {
      // Test unitaire sur le fichier
      test("Alors le nom de mon fichier s'affiche bien dans l'onglet", async () => {
        const code = NewBillUI();
        document.body.innerHTML = code;

        window.onNavigate(ROUTES_PATH.NewBill);

        // On attend le chargement du titre pour confirmer qu'on est sur la bonne page
        await waitFor(() => screen.getByText("Envoyer une note de frais"));

        const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage });

        // jest.fn permet de surveiller les appels de la function handleChangeFile
        const changeFile = jest.fn((e) => newBill.handleChangeFile(e));

        const input = screen.getByTestId('file');

        // On ajoute un event change pour écouter cet evenement
        input.addEventListener('change', changeFile);

        // Simule le changement de fichier dans l'input
        fireEvent.change(input, { target: { files: [new File(['fichier'], 'fichier.jpg', { type: 'image.jpg' })] } });

        // On vérifie que la function est bien appelé et que c'est le bon nom de fichier
        expect(changeFile).toHaveBeenCalled();
        expect(input.files[0].name).toBe('fichier.jpg');
      })
      // Test unitaire sur l'envoie de la note de frais
      test("Alors j'envoie la note et cela créée ma note de frais", async () => {
        // On reprend similairement le code du dessus et on y ajoute quelques modif pour le submit
        const code = NewBillUI();
        document.body.innerHTML = code;

        window.onNavigate(ROUTES_PATH.NewBill);

        const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage });
        const submitFunction = jest.fn((e) => newBill.handleSubmit(e));

        const form = screen.getByTestId('form-new-bill');
        form.addEventListener('submit', submitFunction);

        // Simule la soumission du form
        fireEvent.submit(form, { target: { submit: () => { submitFunction(); } } });

        // On vérifie que la function est bien appelé
        expect(submitFunction).toHaveBeenCalled();
      })
    })
  })
})

// Test d'intégration de la méthode POST
describe("Given I am a user connected as Employe", () => {
  describe("When I navigate to NewBills for add note", () => {
    test("Alors il ajoute une nouvelle note de frais en utilisant la méthode POST", async () => {
      const code = NewBillUI();
      document.body.innerHTML = code;

      // Donnée qu'on ajoutera à notre form
      const formData = {
        type: 'TypeTest',
        name: 'NameTest',
        datepicker: '2023-06-11',
        amount: '999',
        vat: '99',
        pct: '99',
        commentary: 'CommentaryTest',
        file: new File(['test'], 'test.jpg', { type: 'image/jpg' }),
      }

      const inputType = screen.getByTestId('expense-type');
      const inputName = screen.getByTestId('expense-name');
      const inputDate = screen.getByTestId('datepicker');
      const inputAmount = screen.getByTestId('amount');
      const inputVat = screen.getByTestId('vat');
      const inputPct = screen.getByTestId('pct');
      const inputCommentary = screen.getByTestId('commentary');
      const inputFile = screen.getByTestId('file');

      // Ajout des données à notre form
      fireEvent.change(inputType, { target: { value: formData.type } });
      fireEvent.change(inputName, { target: { value: formData.name } });
      fireEvent.change(inputDate, { target: { value: formData.datepicker } });
      fireEvent.change(inputAmount, { target: { value: formData.amount } });
      fireEvent.change(inputVat, { target: { value: formData.vat } });
      fireEvent.change(inputPct, { target: { value: formData.pct } });
      fireEvent.change(inputCommentary, { target: { value: formData.commentary } });
      userEvent.upload(inputFile, formData.file);

      // Permet de simuler la récupération de données
      Object.defineProperty(window, 'localStorage', { value: { getItem: jest.fn(() => JSON.stringify({ email: 'test@email' })) } });

      window.onNavigate(ROUTES_PATH.NewBill);
      const newBill = new NewBill({ document, onNavigate, localStorage: window.localStorage });

      const form = screen.getByTestId('form-new-bill');

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener('submit', handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    })
    describe("When an error occurs on API", () => {
      // Se code se lance avant chaque test se qui permet de créer un context de l'environnement
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("Error and fails with 404 message error", async () => {
        // Similation de l'erreur 404
        const billsError = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = billsError;

        const textError = screen.getByText("Erreur 404");

        expect(textError).toBeTruthy();
      })
      test("Error and fails with 500 message error", async () => {
        // Similation de l'erreur 500
        const billsError = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = billsError;

        const textError = screen.getByText("Erreur 500");

        expect(textError).toBeTruthy();
      })
    })
  })
})