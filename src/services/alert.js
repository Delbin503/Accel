import { Subject } from "rxjs";
import { filter } from "rxjs/operators";

const alertSubject = new Subject();

const defaultId = "default-alert";

export const alertType = {
  Success: "Success",
  Error: "Error",
  Info: "Info",
  Warning: "Warning",
};

export const alert = (alt) => {
  alt.id = alt.id || defaultId;
  alertSubject.next(alt);
}

export const clear = (id = defaultId) => {
  alertSubject.next({ id });
}

export const onAlert = (id = defaultId) => {
  return alertSubject.asObservable().pipe(filter(x => x && x.id === id));
}

export const alertSuccess = (message, options) => {
  alert({ ...options, type: alertType.Success, message });
}

export const alertError = (message, options) => {
  alert({ ...options, type: alertType.Error, message });
}

export const alertInfo = (message, options) => {
  alert({ ...options, type: alertType.Info, message });
}

export const alertWarn = (message, options) => {
  alert({ ...options, type: alertType.Warning, message });
}
