#include <algorithm>
#include <cctype>
#include <iomanip>
#include <iostream>
#include <limits>
#include <optional>
#include <string>
#include <vector>

struct Book {
    int id;
    std::string title;
    std::string author;
    std::string genre;
    int year;
    double rating;
};

enum class SortField {
    Title,
    Author,
    Year,
    Rating
};

struct FilterOptions {
    std::optional<std::string> authorContains;
    std::optional<std::string> genre;
    std::optional<int> yearFrom;
    std::optional<int> yearTo;
    std::optional<double> ratingFrom;
    std::optional<double> ratingTo;
};

class Catalog {
public:
    void addBook(Book book) {
        books_.push_back(std::move(book));
    }

    bool removeById(int id) {
        auto it = std::remove_if(books_.begin(), books_.end(), [id](const Book &book) { return book.id == id; });
        if (it == books_.end()) {
            return false;
        }
        books_.erase(it, books_.end());
        return true;
    }

    std::vector<Book> listBooks(SortField sortField, bool ascending) const {
        std::vector<Book> result = books_;
        auto comparator = [sortField, ascending](const Book &a, const Book &b) {
            switch (sortField) {
            case SortField::Title:
                return ascending ? a.title < b.title : a.title > b.title;
            case SortField::Author:
                return ascending ? a.author < b.author : a.author > b.author;
            case SortField::Year:
                return ascending ? a.year < b.year : a.year > b.year;
            case SortField::Rating:
                return ascending ? a.rating < b.rating : a.rating > b.rating;
            }
            return false;
        };
        std::stable_sort(result.begin(), result.end(), comparator);
        return result;
    }

    std::vector<Book> filter(const FilterOptions &options) const {
        std::vector<Book> result;
        for (const auto &book : books_) {
            if (options.authorContains) {
                if (!containsCaseInsensitive(book.author, *options.authorContains)) {
                    continue;
                }
            }
            if (options.genre) {
                if (!equalsCaseInsensitive(book.genre, *options.genre)) {
                    continue;
                }
            }
            if (options.yearFrom && book.year < *options.yearFrom) {
                continue;
            }
            if (options.yearTo && book.year > *options.yearTo) {
                continue;
            }
            if (options.ratingFrom && book.rating < *options.ratingFrom) {
                continue;
            }
            if (options.ratingTo && book.rating > *options.ratingTo) {
                continue;
            }
            result.push_back(book);
        }
        return result;
    }

private:
    static std::string toLower(const std::string &value) {
        std::string lowered;
        lowered.reserve(value.size());
        for (char ch : value) {
            lowered.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(ch))));
        }
        return lowered;
    }

    static bool containsCaseInsensitive(const std::string &text, const std::string &pattern) {
        const std::string loweredText = toLower(text);
        const std::string loweredPattern = toLower(pattern);
        return loweredText.find(loweredPattern) != std::string::npos;
    }

    static bool equalsCaseInsensitive(const std::string &a, const std::string &b) {
        return toLower(a) == toLower(b);
    }

    std::vector<Book> books_;
};

std::string promptLine(const std::string &message) {
    std::cout << message;
    std::string input;
    std::getline(std::cin, input);
    return input;
}

int promptInt(const std::string &message) {
    int value{};
    while (true) {
        std::cout << message;
        if (std::cin >> value) {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            return value;
        }
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << "Некорректное число. Повторите ввод.\n";
    }
}

double promptDouble(const std::string &message) {
    double value{};
    while (true) {
        std::cout << message;
        if (std::cin >> value) {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            return value;
        }
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << "Некорректное число. Повторите ввод.\n";
    }
}

SortField promptSortField() {
    while (true) {
        std::cout << "Сортировать по [1] Названию, [2] Автору, [3] Году, [4] Рейтингу: ";
        int choice{};
        if (std::cin >> choice) {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            switch (choice) {
            case 1:
                return SortField::Title;
            case 2:
                return SortField::Author;
            case 3:
                return SortField::Year;
            case 4:
                return SortField::Rating;
            default:
                break;
            }
        } else {
            std::cin.clear();
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        }
        std::cout << "Неверный выбор. Попробуйте снова.\n";
    }
}

bool promptAscending() {
    while (true) {
        std::cout << "Порядок сортировки [1] По возрастанию, [2] По убыванию: ";
        int choice{};
        if (std::cin >> choice) {
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            if (choice == 1) {
                return true;
            }
            if (choice == 2) {
                return false;
            }
        } else {
            std::cin.clear();
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        }
        std::cout << "Неверный выбор. Попробуйте снова.\n";
    }
}

FilterOptions promptFilters() {
    FilterOptions options;
    const auto author = promptLine("Фильтр по автору (подстрока, оставьте пустым если не нужно): ");
    if (!author.empty()) {
        options.authorContains = author;
    }

    const auto genre = promptLine("Фильтр по жанру (полное совпадение, пусто чтобы пропустить): ");
    if (!genre.empty()) {
        options.genre = genre;
    }

    const auto yearMinText = promptLine("Минимальный год (пусто чтобы пропустить): ");
    if (!yearMinText.empty()) {
        options.yearFrom = std::stoi(yearMinText);
    }

    const auto yearMaxText = promptLine("Максимальный год (пусто чтобы пропустить): ");
    if (!yearMaxText.empty()) {
        options.yearTo = std::stoi(yearMaxText);
    }

    const auto ratingMinText = promptLine("Минимальный рейтинг (пусто чтобы пропустить): ");
    if (!ratingMinText.empty()) {
        options.ratingFrom = std::stod(ratingMinText);
    }

    const auto ratingMaxText = promptLine("Максимальный рейтинг (пусто чтобы пропустить): ");
    if (!ratingMaxText.empty()) {
        options.ratingTo = std::stod(ratingMaxText);
    }

    return options;
}

void printBooks(const std::vector<Book> &books) {
    if (books.empty()) {
        std::cout << "Каталог пуст.\n";
        return;
    }

    std::cout << std::left << std::setw(5) << "ID" << std::setw(30) << "Название" << std::setw(20) << "Автор"
              << std::setw(15) << "Жанр" << std::setw(6) << "Год" << std::setw(8) << "Рейтинг" << "\n";
    std::cout << std::string(90, '-') << "\n";
    for (const auto &book : books) {
        std::cout << std::left << std::setw(5) << book.id << std::setw(30) << book.title.substr(0, 28)
                  << std::setw(20) << book.author.substr(0, 18) << std::setw(15) << book.genre.substr(0, 13)
                  << std::setw(6) << book.year << std::setw(8) << std::fixed << std::setprecision(2) << book.rating
                  << "\n";
    }
}

void seedCatalog(Catalog &catalog) {
    catalog.addBook({1, "Война и мир", "Лев Толстой", "Роман", 1869, 4.9});
    catalog.addBook({2, "Мастер и Маргарита", "Михаил Булгаков", "Роман", 1967, 4.8});
    catalog.addBook({3, "Норвежский лес", "Харуки Мураками", "Роман", 1987, 4.3});
    catalog.addBook({4, "Цветы для Элджернона", "Даниел Киз", "Фантастика", 1966, 4.7});
    catalog.addBook({5, "Три товарища", "Эрих Мария Ремарк", "Роман", 1936, 4.6});
    catalog.addBook({6, "Дюна", "Фрэнк Герберт", "Фантастика", 1965, 4.8});
}

void showMenu() {
    std::cout << "\nМеню:\n";
    std::cout << "1. Показать каталог\n";
    std::cout << "2. Добавить книгу\n";
    std::cout << "3. Удалить книгу\n";
    std::cout << "4. Фильтровать книги\n";
    std::cout << "5. Выход\n";
}

int main() {
    Catalog catalog;
    seedCatalog(catalog);

    while (true) {
        showMenu();
        std::cout << "Выберите действие: ";
        int action{};
        if (!(std::cin >> action)) {
            std::cout << "Некорректный ввод. Завершение программы.\n";
            break;
        }
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        if (action == 1) {
            const auto sortField = promptSortField();
            const bool ascending = promptAscending();
            const auto sortedBooks = catalog.listBooks(sortField, ascending);
            printBooks(sortedBooks);
        } else if (action == 2) {
            Book book{};
            book.id = promptInt("ID книги: ");
            book.title = promptLine("Название: ");
            book.author = promptLine("Автор: ");
            book.genre = promptLine("Жанр: ");
            book.year = promptInt("Год издания: ");
            book.rating = promptDouble("Рейтинг (0-5): ");
            catalog.addBook(std::move(book));
            std::cout << "Книга добавлена.\n";
        } else if (action == 3) {
            const int id = promptInt("ID книги для удаления: ");
            if (catalog.removeById(id)) {
                std::cout << "Книга удалена.\n";
            } else {
                std::cout << "Книга с таким ID не найдена.\n";
            }
        } else if (action == 4) {
            const auto filters = promptFilters();
            const auto filtered = catalog.filter(filters);
            printBooks(filtered);
        } else if (action == 5) {
            std::cout << "До свидания!\n";
            break;
        } else {
            std::cout << "Неверный пункт меню. Попробуйте снова.\n";
        }
    }

    return 0;
}
