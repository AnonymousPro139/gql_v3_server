-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 22, 2024 at 09:54 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.1.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `graphql_v1`
--

-- --------------------------------------------------------

--
-- Table structure for table `avatar`
--

CREATE TABLE `avatar` (
  `id` int(10) UNSIGNED NOT NULL,
  `avatar_link` varchar(60) DEFAULT 'no-link',
  `isAvatarSet` tinyint(1) DEFAULT 0,
  `userId` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `avatar`
--

INSERT INTO `avatar` (`id`, `avatar_link`, `isAvatarSet`, `userId`) VALUES
(1, '2b08Nq8LlxHDFl1lKM0tJfqeLOih3g1I8CxD2u6hx53k2xrxQ9pEkK', 1, 1),
(2, '2b08Nq8LlxHDFl1lKM0tJfqeLO1TVAOJLovmkg0L451zQUwdbRxJD6', 1, 2),
(3, '2b08Nq8LlxHDFl1lKM0tJfqeLOFkjcR9fMyHKci4nk7dlwyaGjCZxrYyG', 1, 3),
(4, '2b08Nq8LlxHDFl1lKM0tJfqeLO1TVAOJLovmkg0L451zQUwdbRxJD6', 1, 4),
(5, '2b08Nq8LlxHDFl1lKM0tJfqeLOfqfmDECFJ10zlR7P5yEMDtoGPMBqeG', 1, 5),
(6, '2b08Nq8LlxHDFl1lKM0tJfqeLOXUp0OXRfTZcoBV2bnGxsQaKw2f9MqK', 1, 6),
(7, '2b08Nq8LlxHDFl1lKM0tJfqeLOuUoNPJomyGAwfJhwNwHdEhN0dOqE90m', 1, 7),
(8, '2b08Nq8LlxHDFl1lKM0tJfqeLOvfwwT6lbm09alrczeuBqOSDOx5wLK', 1, 8),
(9, '2b08Nq8LlxHDFl1lKM0tJfqeLOvfwwT6lbm09alrczeuBqOSDOx5wLK', 1, 9),
(10, '2b08Nq8LlxHDFl1lKM0tJfqeLOe1jh9y0FYHcbvz4JMRFhdu10v9BmMS', 1, 10);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `avatar`
--
ALTER TABLE `avatar`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `avatar`
--
ALTER TABLE `avatar`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `avatar`
--
ALTER TABLE `avatar`
  ADD CONSTRAINT `avatar_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
