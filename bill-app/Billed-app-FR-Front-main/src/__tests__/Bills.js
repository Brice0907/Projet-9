/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      //to-do write expect expression
      // On vérifie si la class c'est bien 'active-icon'
      expect(windowIcon.className).toEqual('active-icon');

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    })

    // Test unitaire sur l'icon eye
    test("Alors lorsque je clique sur l'icone de l'oeil ca ouvre la modal", () => {

      // Permet de simuler l'affichage
      document.body.innerHTML = BillsUI({ data: bills });

      // Permet de simuler la navigation (URL)
      window.onNavigate(ROUTES_PATH.Bills);

      // Permet de créer une "instance" bills
      const containerBills = new Bills({ document, onNavigate, localStorage: window.localStorage });

      // $.fn.modal permet d'afficher des modales mais on la remplace par jest.fn() pour voir si la function est appelé
      // se qui nous permet de ne plus avoir l'erreur $(...).modal is not function !
      $.fn.modal = jest.fn();


      const iconEye = screen.getAllByTestId('icon-eye')[0];
      // On spy handleClickIconEye de l'objet containerBills ceux qui nous permet de savoir si elle est appelé ou non
      const listenerClick = jest.spyOn(containerBills, 'handleClickIconEye');

      // On déclenche le click
      fireEvent.click(iconEye);
      // Puis on vérifie si la méthode qu'on a espionné est appelé
      expect(listenerClick).toHaveBeenCalled();
    })
  })
})

// Test d'intégration de la méthode GET
describe("Given I am a user connected as Employe", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      // Permet de simuler la présence d'un Employé
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      window.onNavigate(ROUTES_PATH.Bills);

      const bills = new Bills({ document, onNavigate, store: mockStore, localStorage });

      // On affiche les données du tableau
      bills.getBills().then(snapshot => {
        root.innerHTML = BillsUI({ snapshot });
        const content = document.querySelector('tbody');

        // Vérifie que le nbr de ligne dans l'element tbody soit egal au nombre d'elements du tableau
        expect(content.rows.length).toEqual(snapshot.length);
      })
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
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      })
      test("fetches bills from an API and fails with 404 message error", async () => {
        // Similation de l'erreur 404
        const billsError = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = billsError;

        const textError = screen.getByText("Erreur 404");

        expect(textError).toBeTruthy();
      })
      test("fetches messages from an API and fails with 500 message error", async () => {
        // Similation de l'erreur 500
        const billsError = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = billsError;

        const textError = screen.getByText("Erreur 500");

        expect(textError).toBeTruthy();
      })
    })
  })
})